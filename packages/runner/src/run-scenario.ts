import { type MapDocument, mapDocumentSchema, checkMapSemantics } from "@bus20/contracts/map";
import { fail, formatIssues, type Issue, issue, ok, type Result } from "@bus20/contracts/result";
import { type RunLog, runLogSchema } from "@bus20/contracts/run-log";
import { type RunResult } from "@bus20/contracts/run-result";
import {
  type ScenarioDocument,
  scenarioDocumentSchema,
  checkScenarioSemantics,
} from "@bus20/contracts/scenario";
import { createSwiftReferencePolicy } from "@bus20/baselines/swift-reference";
import { createClaudePolicy, type Effort } from "@bus20/models/claude-policy";
import { createJevPolicy } from "@bus20/models/jev-policy";
import { type ChoiceSettings } from "@bus20/models/choice-procedure";
import { type PresentationId } from "@bus20/models/presentation";
import { type PolicyProgram, policyProgramSchema } from "@bus20/contracts/policy-artifact";
import { createProgramPolicy } from "@bus20/policy-runtime/program-policy";
import { checkScenarioOnMap } from "@bus20/graph/scenario-check";
import { scoreRun } from "@bus20/scoring/score";
import { createFixturePolicy } from "@bus20/simulator/fixture-policy";
import { type Policy } from "@bus20/simulator/policy";
import { type ReplayVerdict, verifyReplay } from "@bus20/simulator/replay";
import { runSimulation } from "@bus20/simulator/run";
import path from "node:path";
import { readJsonFile, writeJsonAtomic } from "./files.js";
import { type Logger } from "./logging.js";

export const RUN_LOG_FILE = "run-log.json";
export const RUN_RESULT_FILE = "run-result.json";

export interface Inputs {
  readonly scenario: ScenarioDocument;
  readonly map: MapDocument;
}

const semanticIssues = (scenario: ScenarioDocument, map: MapDocument): Issue[] => [
  ...checkMapSemantics(map),
  ...checkScenarioSemantics(scenario),
  ...checkScenarioOnMap(scenario, map),
];

/** Loads and fully validates a scenario and its map from disk. */
export const loadInputs = async (
  scenarioPath: string,
  mapPath: string,
): Promise<Result<Inputs>> => {
  const scenario = await readJsonFile(scenarioPath, scenarioDocumentSchema);
  const map = await readJsonFile(mapPath, mapDocumentSchema);
  if (!scenario.ok || !map.ok) {
    return fail([...(scenario.ok ? [] : scenario.issues), ...(map.ok ? [] : map.issues)]);
  }
  const issues = semanticIssues(scenario.value, map.value);
  return issues.length === 0 ? ok({ scenario: scenario.value, map: map.value }) : fail(issues);
};

export interface RunSummary {
  readonly log: RunLog;
  readonly result: RunResult;
  readonly replay: ReplayVerdict;
  readonly logPath: string;
  readonly resultPath: string;
}

export interface RunRequest {
  readonly inputs: Inputs;
  readonly policy: Policy;
  readonly outDir: string;
  readonly maxDecisions?: number;
  readonly logger: Logger;
}

const persist = async (outDir: string, log: RunLog, result: RunResult) => {
  const logPath = path.join(outDir, RUN_LOG_FILE);
  const resultPath = path.join(outDir, RUN_RESULT_FILE);
  await writeJsonAtomic(logPath, log);
  await writeJsonAtomic(resultPath, result);
  return { logPath, resultPath };
};

/** Runs, scores, verifies replay, and persists both documents atomically. */
export const runAndScore = async (request: RunRequest): Promise<RunSummary> => {
  const { inputs, policy, outDir, logger } = request;
  const options = request.maxDecisions === undefined ? {} : { maxDecisions: request.maxDecisions };
  logger.log("info", "run.start", {
    scenarioId: inputs.scenario.id,
    policyId: policy.descriptor.id,
  });
  const log = await runSimulation(inputs.scenario, inputs.map, policy, options);
  const result = scoreRun(inputs.scenario, inputs.map, log);
  const replay = await verifyReplay(inputs.scenario, inputs.map, log);
  const paths = await persist(outDir, log, result);
  logger.log("info", "run.done", {
    status: result.status,
    pain: result.pain,
    replayMatches: replay.matches,
  });
  return { log, result, replay, ...paths };
};

/** Replays a stored log against its scenario and map and reports agreement. */
export const replayStoredLog = async (
  inputs: Inputs,
  logPath: string,
): Promise<Result<ReplayVerdict>> => {
  const log = await readJsonFile(logPath, runLogSchema);
  if (!log.ok) {
    return log;
  }
  return ok(await verifyReplay(inputs.scenario, inputs.map, log.value));
};

export interface PolicyOptions {
  /** Path to the built Swift `bus20-baseline` executable, required for `swift`. */
  readonly swiftCommand?: string;
  /** Exact model ID for `claude` or `jev`; defaults are the pinned IDs. */
  readonly modelId?: string;
  /** Reasoning effort for `claude`. */
  readonly effort?: Effort;
  /** Flat, hierarchical, or auto choice for `claude` and `jev`. */
  readonly choice?: ChoiceSettings;
  /** Jev only: presentation and self-consistency repeats. */
  readonly presentation?: PresentationId;
  readonly repeats?: number;
  /** A frozen generated program for `program`, plus the seed its Math.random gets. */
  readonly program?: PolicyProgram;
  readonly programSeed?: number;
}

/** A policy plus its cleanup, so the CLI can release child processes. */
export interface ManagedPolicy {
  readonly policy: Policy;
  readonly close: () => void;
}

export const POLICY_IDS = ["fixture", "swift", "claude", "jev", "program"] as const;

const noop = (): undefined => undefined;

const createModelPolicy = (policyId: string, options: PolicyOptions): Policy | undefined => {
  const shared = {
    ...(options.modelId === undefined ? {} : { modelId: options.modelId }),
    ...(options.choice === undefined ? {} : { choice: options.choice }),
  };
  if (policyId === "claude") {
    const effort = options.effort === undefined ? {} : { effort: options.effort };
    return createClaudePolicy({ ...shared, ...effort });
  }
  if (policyId === "jev") {
    return createJevPolicy({
      ...shared,
      ...(options.presentation === undefined ? {} : { presentation: options.presentation }),
      ...(options.repeats === undefined ? {} : { repeats: options.repeats }),
    });
  }
  return undefined;
};

/** API keys come from the environment (ANTHROPIC_API_KEY, TYPESAFE_API_KEY) and are never logged. */
export const createPolicyById = (
  policyId: string,
  options: PolicyOptions = {},
): ManagedPolicy | undefined => {
  if (policyId === "fixture") {
    return { policy: createFixturePolicy(), close: noop };
  }
  const external = createExternalPolicy(policyId, options);
  if (external !== undefined) {
    return { policy: external, close: external.close };
  }
  const policy = createModelPolicy(policyId, options);
  return policy === undefined ? undefined : { policy, close: noop };
};

/** Policies backed by a child process: the Swift reference and generated programs. */
const createExternalPolicy = (
  policyId: string,
  options: PolicyOptions,
): (Policy & { readonly close: () => void }) | undefined => {
  if (policyId === "swift" && options.swiftCommand !== undefined) {
    return createSwiftReferencePolicy({ command: options.swiftCommand });
  }
  if (policyId === "program" && options.program !== undefined) {
    return createProgramPolicy({ program: options.program, seed: options.programSeed ?? 0 });
  }
  return undefined;
};

export const describeIssues = (issues: readonly Issue[]): string => formatIssues(issues);

/** Loads a frozen program artifact; programs that failed to compile are refused. */
export const loadProgram = async (programPath: string): Promise<Result<PolicyProgram>> => {
  const program = await readJsonFile(programPath, policyProgramSchema);
  if (program.ok && program.value.compileError !== null) {
    return fail([issue(programPath, `program did not compile: ${program.value.compileError}`)]);
  }
  return program;
};
