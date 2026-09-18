#!/usr/bin/env node
import { type Issue } from "@bus20/contracts/result";
import { type SuiteIndex } from "@bus20/contracts/suite-index";
import { EFFORT_LEVELS, type Effort } from "@bus20/models/claude-policy";
import { comparisonMarkdown, loadRunDirectory } from "./compare.js";
import { writeTextAtomic } from "./files.js";
import { loadSuite } from "@bus20/datasets/files";
import path from "node:path";
import { parseArgs } from "node:util";
import { runSuite, SUITE_INDEX_FILE } from "./suite.js";
import { createStderrLogger } from "./logging.js";
import {
  createPolicyById,
  describeIssues,
  type Inputs,
  loadInputs,
  type ManagedPolicy,
  replayStoredLog,
  runAndScore,
  type RunSummary,
} from "./run-scenario.js";

const USAGE = `usage:
  bus20-run run --scenario <file> --map <file> --out <dir>
                [--policy fixture|swift|claude|jev] [--swift-cli <path>]
                [--model <id>] [--effort low|medium|high|xhigh|max] [--max-decisions N]
  bus20-run replay --scenario <file> --map <file> --log <file>
  bus20-run compare <run-dir>... [--markdown <file>]
  bus20-run suite --manifest <file> --policies <id,id,...> --out <dir>
                [--splits dev,validation,test] [--repetitions N] [--limit N]
                [--swift-cli <path>] [--model <id>] [--effort <level>] [--max-decisions N]`;

const EXIT_OK = 0;
const EXIT_USAGE = 2;
const EXIT_FAILED = 1;

interface ParsedArgs {
  readonly command: string | undefined;
  readonly positionals: readonly string[];
  readonly values: {
    readonly scenario?: string;
    readonly map?: string;
    readonly out?: string;
    readonly log?: string;
    readonly policy?: string;
    readonly "swift-cli"?: string;
    readonly model?: string;
    readonly effort?: string;
    readonly markdown?: string;
    readonly manifest?: string;
    readonly policies?: string;
    readonly splits?: string;
    readonly repetitions?: string;
    readonly limit?: string;
    readonly "max-decisions"?: string;
  };
}

const OPTIONS = {
  scenario: { type: "string" },
  map: { type: "string" },
  out: { type: "string" },
  log: { type: "string" },
  policy: { type: "string", default: "fixture" },
  "swift-cli": { type: "string" },
  model: { type: "string" },
  effort: { type: "string" },
  markdown: { type: "string" },
  manifest: { type: "string" },
  policies: { type: "string" },
  splits: { type: "string", default: "dev" },
  repetitions: { type: "string", default: "1" },
  limit: { type: "string" },
  "max-decisions": { type: "string" },
} as const;

const parse = (argv: readonly string[]): ParsedArgs => {
  const { values, positionals } = parseArgs({
    args: [...argv],
    allowPositionals: true,
    options: OPTIONS,
  });
  return { command: positionals[0], positionals: positionals.slice(1), values };
};

const nonEmpty = (value: string | undefined): string | undefined =>
  value === undefined || value === "" ? undefined : value;

const emit = (value: unknown): void => {
  process.stdout.write(`${JSON.stringify(value)}\n`);
};

const parseMaxDecisions = (raw: string | undefined): number | undefined => {
  if (raw === undefined) {
    return undefined;
  }
  const value = Number.parseInt(raw, 10);
  return Number.isInteger(value) && value > 0 ? value : undefined;
};

const usageError = (): number => {
  process.stderr.write(`${USAGE}\n`);
  return EXIT_USAGE;
};

const issuesError = (issues: readonly Issue[]): number => {
  process.stderr.write(`${describeIssues(issues)}\n`);
  return EXIT_USAGE;
};

const reportRun = (summary: RunSummary): number => {
  const { result, replay, logPath, resultPath } = summary;
  emit({
    status: result.status,
    pain: result.pain,
    replayMatches: replay.matches,
    logPath,
    resultPath,
  });
  return result.status === "complete" && replay.matches ? EXIT_OK : EXIT_FAILED;
};

const parseEffort = (raw: string | undefined): Effort | undefined =>
  EFFORT_LEVELS.find((level) => level === raw);

const selectPolicy = (args: ParsedArgs): ManagedPolicy | undefined => {
  const swiftCommand = args.values["swift-cli"] ?? nonEmpty(process.env["BUS20_SWIFT_CLI"]);
  const effort = parseEffort(args.values.effort);
  if (args.values.effort !== undefined && effort === undefined) {
    return undefined;
  }
  return createPolicyById(args.values.policy ?? "fixture", {
    ...(swiftCommand === undefined ? {} : { swiftCommand }),
    ...(args.values.model === undefined ? {} : { modelId: args.values.model }),
    ...(effort === undefined ? {} : { effort }),
  });
};

const policyFactories = (args: ParsedArgs): (() => ManagedPolicy)[] | undefined => {
  const ids = (args.values.policies ?? "").split(",").filter((id) => id !== "");
  const factories = ids.map((id) => () => {
    const managed = selectPolicy({ ...args, values: { ...args.values, policy: id } });
    if (managed === undefined) {
      throw new Error(`unknown or unavailable policy "${id}"`);
    }
    return managed;
  });
  return factories.length === 0 ? undefined : factories;
};

const suiteOptions = (args: ParsedArgs) => {
  const limit = parseMaxDecisions(args.values.limit);
  const maxDecisions = parseMaxDecisions(args.values["max-decisions"]);
  return {
    splits: (args.values.splits ?? "dev").split(","),
    repetitions: parseMaxDecisions(args.values.repetitions) ?? 1,
    ...(limit === undefined ? {} : { limit }),
    ...(maxDecisions === undefined ? {} : { maxDecisions }),
  };
};

const suiteCommand = async (args: ParsedArgs): Promise<number> => {
  const { manifest, out } = args.values;
  const factories = policyFactories(args);
  if (manifest === undefined || out === undefined || factories === undefined) {
    return usageError();
  }
  const suite = await loadSuite(manifest);
  if (!suite.ok) {
    return issuesError(suite.issues);
  }
  const logger = createStderrLogger();
  const index = await runSuite({
    suite: suite.value,
    policies: factories,
    outDir: out,
    logger,
    ...suiteOptions(args),
  });
  return reportSuite(out, index);
};

const reportSuite = (out: string, index: SuiteIndex): number => {
  const failed = index.runs.filter((run) => run.status === "failed").length;
  emit({ indexPath: path.join(out, SUITE_INDEX_FILE), runs: index.runs.length, failed });
  return EXIT_OK;
};

const compareCommand = async (args: ParsedArgs): Promise<number> => {
  if (args.positionals.length === 0) {
    return usageError();
  }
  const loaded = await Promise.all(args.positionals.map(loadRunDirectory));
  const issues = loaded.flatMap((row) => (row.ok ? [] : row.issues));
  if (issues.length > 0) {
    return issuesError(issues);
  }
  const rows = loaded.flatMap((row) => (row.ok ? [row.value] : []));
  if (args.values.markdown !== undefined) {
    await writeTextAtomic(args.values.markdown, `${comparisonMarkdown(rows)}\n`);
  }
  emit({ rows });
  return EXIT_OK;
};

const runWithPolicy = async (
  args: ParsedArgs,
  inputs: Inputs,
  managed: ManagedPolicy,
  outDir: string,
): Promise<number> => {
  const maxDecisions = parseMaxDecisions(args.values["max-decisions"]);
  try {
    const summary = await runAndScore({
      inputs,
      policy: managed.policy,
      outDir,
      logger: createStderrLogger(),
      ...(maxDecisions === undefined ? {} : { maxDecisions }),
    });
    return reportRun(summary);
  } finally {
    managed.close();
  }
};

/** Policy construction fails fast on missing credentials; the message never includes a key. */
const selectPolicySafely = (args: ParsedArgs): ManagedPolicy | undefined => {
  try {
    return selectPolicy(args);
  } catch (error: unknown) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    return undefined;
  }
};

const runCommand = async (args: ParsedArgs): Promise<number> => {
  const { scenario, map, out } = args.values;
  const managed = selectPolicySafely(args);
  if (scenario === undefined || map === undefined || out === undefined || managed === undefined) {
    return usageError();
  }
  const inputs = await loadInputs(scenario, map);
  return inputs.ok ? runWithPolicy(args, inputs.value, managed, out) : issuesError(inputs.issues);
};

const replayCommand = async (args: ParsedArgs): Promise<number> => {
  const { scenario, map, log } = args.values;
  if (scenario === undefined || map === undefined || log === undefined) {
    return usageError();
  }
  const inputs = await loadInputs(scenario, map);
  if (!inputs.ok) {
    return issuesError(inputs.issues);
  }
  const verdict = await replayStoredLog(inputs.value, log);
  if (!verdict.ok) {
    return issuesError(verdict.issues);
  }
  emit({ replayMatches: verdict.value.matches, differences: verdict.value.differences });
  return verdict.value.matches ? EXIT_OK : EXIT_FAILED;
};

export const main = async (argv: readonly string[]): Promise<number> => {
  const args = parse(argv);
  if (args.command === "run") {
    return runCommand(args);
  }
  if (args.command === "replay") {
    return replayCommand(args);
  }
  if (args.command === "compare") {
    return compareCommand(args);
  }
  if (args.command === "suite") {
    return suiteCommand(args);
  }
  return usageError();
};

main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`,
    );
    process.exitCode = EXIT_FAILED;
  },
);
