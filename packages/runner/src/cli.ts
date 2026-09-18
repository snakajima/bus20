#!/usr/bin/env node
import { type Issue } from "@bus20/contracts/result";
import { parseArgs } from "node:util";
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
  bus20-run run --scenario <file> --map <file> --out <dir> [--policy fixture|swift]
                [--swift-cli <path>] [--max-decisions N]
  bus20-run replay --scenario <file> --map <file> --log <file>`;

const EXIT_OK = 0;
const EXIT_USAGE = 2;
const EXIT_FAILED = 1;

interface ParsedArgs {
  readonly command: string | undefined;
  readonly values: {
    readonly scenario?: string;
    readonly map?: string;
    readonly out?: string;
    readonly log?: string;
    readonly policy?: string;
    readonly "swift-cli"?: string;
    readonly "max-decisions"?: string;
  };
}

const parse = (argv: readonly string[]): ParsedArgs => {
  const { values, positionals } = parseArgs({
    args: [...argv],
    allowPositionals: true,
    options: {
      scenario: { type: "string" },
      map: { type: "string" },
      out: { type: "string" },
      log: { type: "string" },
      policy: { type: "string", default: "fixture" },
      "swift-cli": { type: "string" },
      "max-decisions": { type: "string" },
    },
  });
  return { command: positionals[0], values };
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

const selectPolicy = (args: ParsedArgs): ManagedPolicy | undefined => {
  const swiftCommand = args.values["swift-cli"] ?? nonEmpty(process.env["BUS20_SWIFT_CLI"]);
  const policyId = args.values.policy ?? "fixture";
  return createPolicyById(policyId, swiftCommand === undefined ? {} : { swiftCommand });
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

const runCommand = async (args: ParsedArgs): Promise<number> => {
  const { scenario, map, out } = args.values;
  const managed = selectPolicy(args);
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
