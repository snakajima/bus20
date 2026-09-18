import { type MapDocument, mapDocumentSchema, checkMapSemantics } from "@bus20/contracts/map";
import { fail, formatIssues, type Issue, ok, type Result } from "@bus20/contracts/result";
import { type RunLog, runLogSchema } from "@bus20/contracts/run-log";
import { type RunResult } from "@bus20/contracts/run-result";
import {
  type ScenarioDocument,
  scenarioDocumentSchema,
  checkScenarioSemantics,
} from "@bus20/contracts/scenario";
import { createSwiftReferencePolicy } from "@bus20/baselines/swift-reference";
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
}

/** A policy plus its cleanup, so the CLI can release child processes. */
export interface ManagedPolicy {
  readonly policy: Policy;
  readonly close: () => void;
}

export const POLICY_IDS = ["fixture", "swift"] as const;

export const createPolicyById = (
  policyId: string,
  options: PolicyOptions = {},
): ManagedPolicy | undefined => {
  if (policyId === "fixture") {
    return { policy: createFixturePolicy(), close: () => undefined };
  }
  if (policyId === "swift" && options.swiftCommand !== undefined) {
    const policy = createSwiftReferencePolicy({ command: options.swiftCommand });
    return { policy, close: policy.close };
  }
  return undefined;
};

export const describeIssues = (issues: readonly Issue[]): string => formatIssues(issues);
