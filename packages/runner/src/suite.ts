import { digestDocument } from "@bus20/contracts/digest";
import { type ManifestScenario } from "@bus20/contracts/manifest";
import { type RunLog, runLogSchema } from "@bus20/contracts/run-log";
import { type RunResult, runResultSchema } from "@bus20/contracts/run-result";
import { type SuiteIndex, type SuiteRun } from "@bus20/contracts/suite-index";
import { SUITE_INDEX_SCHEMA_VERSION } from "@bus20/contracts/versions";
import { type LoadedSuite } from "@bus20/datasets/files";
import path from "node:path";
import { type ComparisonRow, toRow } from "./compare.js";
import { readJsonFile, writeJsonAtomic } from "./files.js";
import { type Logger } from "./logging.js";
import {
  type Inputs,
  type ManagedPolicy,
  RUN_LOG_FILE,
  RUN_RESULT_FILE,
  runAndScore,
} from "./run-scenario.js";

export const SUITE_INDEX_FILE = "suite-index.json";

export interface SuiteRequest {
  readonly suite: LoadedSuite;
  /** Factories so each run gets a fresh policy (fresh memory, fresh process). */
  readonly policies: readonly (() => ManagedPolicy)[];
  readonly splits: readonly string[];
  readonly repetitions: number;
  readonly outDir: string;
  readonly maxDecisions?: number;
  /** Optional cap on scenarios, for smoke runs. */
  readonly limit?: number;
  /** Optional scenario filter (for example, excluding a held-out city). */
  readonly scenarioFilter?: (scenario: ManifestScenario) => boolean;
  readonly logger: Logger;
}

const safeName = (value: string): string => value.replace(/[^A-Za-z0-9._-]/g, "_");

/** Relative to the suite index file, so a copied results directory stays valid. */
const relativeRunDir = (policyId: string, scenarioId: string, repetition: number): string =>
  path.join(safeName(policyId), scenarioId, `rep-${repetition}`);

interface Outcome {
  readonly log: RunLog;
  readonly result: RunResult;
  readonly replayMatches: boolean;
}

type Metrics = Pick<
  SuiteRun,
  | "status"
  | "pain"
  | "completedCount"
  | "requestCount"
  | "decisions"
  | "latencyMedianMs"
  | "latencyP95Ms"
  | "inputTokens"
  | "outputTokens"
  | "costUsd"
  | "programCpuMs"
>;

const metricsOf = (row: ComparisonRow): Metrics => ({
  status: row.status,
  pain: row.pain,
  completedCount: row.completedCount,
  requestCount: row.requestCount,
  decisions: row.decisions,
  latencyMedianMs: row.latencyMedianMs,
  latencyP95Ms: row.latencyP95Ms,
  inputTokens: row.inputTokens,
  outputTokens: row.outputTokens,
  costUsd: row.costUsd,
  programCpuMs: row.programCpuMs,
});

const toSuiteRun = (
  scenario: ManifestScenario,
  repetition: number,
  dir: string,
  { log, result, replayMatches }: Outcome,
): SuiteRun => {
  const row = toRow(log, result);
  return {
    policy: log.policy,
    scenario,
    repetition,
    dir,
    ...metricsOf(row),
    failureReason: result.status === "failed" ? result.failure.reason : null,
    failureDetail: result.status === "failed" ? result.failure.detail : null,
    replayMatches,
  };
};

/** A finished run is reused as-is so an interrupted suite resumes without re-spending. */
const existingRun = async (
  dir: string,
): Promise<{ log: RunLog; result: RunResult } | undefined> => {
  const log = await readJsonFile(path.join(dir, RUN_LOG_FILE), runLogSchema);
  const result = await readJsonFile(path.join(dir, RUN_RESULT_FILE), runResultSchema);
  return log.ok && result.ok ? { log: log.value, result: result.value } : undefined;
};

const inputsFor = (request: SuiteRequest, scenario: ManifestScenario): Inputs => {
  const document = request.suite.scenarios.get(scenario.id);
  const map = document === undefined ? undefined : request.suite.maps.get(scenario.mapId);
  if (document === undefined || map === undefined) {
    throw new Error(`suite is missing scenario "${scenario.id}" or its map`);
  }
  return { scenario: document, map };
};

const runFresh = async (
  request: SuiteRequest,
  managed: ManagedPolicy,
  scenario: ManifestScenario,
  dir: string,
): Promise<Outcome> => {
  const options = request.maxDecisions === undefined ? {} : { maxDecisions: request.maxDecisions };
  const summary = await runAndScore({
    inputs: inputsFor(request, scenario),
    policy: managed.policy,
    outDir: dir,
    logger: request.logger,
    ...options,
  });
  return { log: summary.log, result: summary.result, replayMatches: summary.replay.matches };
};

/** Reuses a finished run when present; otherwise runs it. */
const obtainOutcome = async (
  request: SuiteRequest,
  managed: ManagedPolicy,
  scenario: ManifestScenario,
  dir: string,
): Promise<Outcome> => {
  const reused = await existingRun(path.join(request.outDir, dir));
  if (reused !== undefined) {
    request.logger.log("info", "suite.reuse", { dir });
    return { ...reused, replayMatches: true };
  }
  return runFresh(request, managed, scenario, path.join(request.outDir, dir));
};

const runOne = async (
  request: SuiteRequest,
  factory: () => ManagedPolicy,
  scenario: ManifestScenario,
  repetition: number,
): Promise<SuiteRun> => {
  const managed = factory();
  const dir = relativeRunDir(managed.policy.descriptor.id, scenario.id, repetition);
  try {
    const outcome = await obtainOutcome(request, managed, scenario, dir);
    return toSuiteRun(scenario, repetition, dir, outcome);
  } finally {
    managed.close();
  }
};

const selectedScenarios = (request: SuiteRequest): ManifestScenario[] => {
  const chosen = request.suite.manifest.scenarios.filter(
    (scenario) =>
      request.splits.includes(scenario.split) && (request.scenarioFilter?.(scenario) ?? true),
  );
  return request.limit === undefined ? chosen : chosen.slice(0, request.limit);
};

/** Policy order alternates per scenario so run order is not confounded with policy. */
const orderedPolicies = (
  policies: readonly (() => ManagedPolicy)[],
  scenarioIndex: number,
): readonly (() => ManagedPolicy)[] =>
  scenarioIndex % 2 === 0 ? policies : [...policies].reverse();

/**
 * Paired evaluation: every policy on every selected scenario, repeated,
 * with the index rewritten after each run so progress survives interruption.
 */
const indexOf = (request: SuiteRequest, runs: readonly SuiteRun[]): SuiteIndex => ({
  schemaVersion: SUITE_INDEX_SCHEMA_VERSION,
  benchmarkVersion: request.suite.manifest.benchmarkVersion,
  manifestDigest: digestDocument(request.suite.manifest),
  splits: [...request.splits],
  repetitions: request.repetitions,
  runs: [...runs],
});

/** Every (scenario, repetition, policy) triple in execution order. */
const schedule = (request: SuiteRequest): [ManifestScenario, number, () => ManagedPolicy][] =>
  selectedScenarios(request).flatMap((scenario, scenarioIndex) =>
    Array.from({ length: request.repetitions }, (_, repetition) => repetition).flatMap(
      (repetition) =>
        orderedPolicies(request.policies, scenarioIndex).map(
          (factory): [ManifestScenario, number, () => ManagedPolicy] => [
            scenario,
            repetition,
            factory,
          ],
        ),
    ),
  );

export const runSuite = async (request: SuiteRequest): Promise<SuiteIndex> => {
  const runs: SuiteRun[] = [];
  const indexPath = path.join(request.outDir, SUITE_INDEX_FILE);
  for (const [scenario, repetition, factory] of schedule(request)) {
    runs.push(await runOne(request, factory, scenario, repetition));
    await writeJsonAtomic(indexPath, indexOf(request, runs));
  }
  return indexOf(request, runs);
};
