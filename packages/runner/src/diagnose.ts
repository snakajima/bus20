import { incrementalCosts, type RankedCandidate } from "@bus20/baselines/insertion-rule";
import {
  type ConsequenceSummary,
  type DecisionDiagnostic,
} from "@bus20/analysis/decision-diagnosis";
import { type Candidate, type Observation } from "@bus20/contracts/observation";
import { type DecisionRecord, type RunLog, runLogSchema } from "@bus20/contracts/run-log";
import { type SuiteRun, suiteIndexSchema } from "@bus20/contracts/suite-index";
import { type LoadedSuite } from "@bus20/datasets/files";
import { consequencesOf } from "@bus20/models/jev-native";
import { type Policy } from "@bus20/simulator/policy";
import { createReplayPolicy } from "@bus20/simulator/replay";
import { runSimulation } from "@bus20/simulator/run";
import path from "node:path";
import { readJsonFile } from "./files.js";
import { type Inputs, RUN_LOG_FILE } from "./run-scenario.js";
import { SUITE_INDEX_FILE } from "./suite.js";

/** Replays a stored run and scores every recorded choice against the insertion rule. */
interface RunKey {
  readonly load: string;
  readonly repetition: number;
}

const summaryOf = (observation: Observation, candidate: Candidate): ConsequenceSummary => {
  const consequences = consequencesOf(observation, candidate);
  return {
    waitMinutes: consequences.waitMinutes,
    detourMinutes: consequences.detourMinutes,
    othersDelayed: consequences.othersDelayed.length,
    largestDelayMinutes: Math.max(0, ...consequences.othersDelayed.map((d) => d.extraMinutes)),
  };
};

/** Rank by incremental cost; equal costs share the lowest rank of their cost. */
const rankOf = (ranked: readonly RankedCandidate[], chosenId: string): number => {
  const [, chosen] = bestAndChosen(ranked, chosenId);
  return ranked.filter((item) => item.incrementalCostMs2 < chosen.incrementalCostMs2).length;
};

const chosenIdOf = (record: DecisionRecord): string => {
  if (record.action.kind !== "chooseCandidate") {
    throw new Error(`decision for ${record.requestId} is not a candidate choice`);
  }
  return record.action.candidateId;
};

const bestAndChosen = (
  ranked: readonly RankedCandidate[],
  chosenId: string,
): [RankedCandidate, RankedCandidate] => {
  const best = [...ranked].sort((a, b) => a.incrementalCostMs2 - b.incrementalCostMs2)[0];
  const chosen = ranked.find((item) => item.candidate.id === chosenId);
  if (best === undefined || chosen === undefined) {
    throw new Error(`chosen candidate "${chosenId}" is not among the offered candidates`);
  }
  return [best, chosen];
};

const jevSignals = (record: DecisionRecord) => {
  const confidence = record.usage?.["confidence"];
  const chosenProbability = record.usage?.["chosenProbability"];
  return {
    ...(confidence === undefined ? {} : { confidence }),
    ...(chosenProbability === undefined ? {} : { chosenProbability }),
  };
};

/** Identifies the run every record of one replay belongs to. */
interface RunContext extends RunKey {
  readonly policyId: string;
  readonly scenarioId: string;
}

const diagnostic = (
  context: RunContext,
  record: DecisionRecord,
  observation: Observation,
): DecisionDiagnostic => {
  const ranked = incrementalCosts(observation);
  const chosenId = chosenIdOf(record);
  const [best, chosen] = bestAndChosen(ranked, chosenId);
  return {
    ...context,
    requestId: record.requestId,
    candidates: ranked.length,
    rank: rankOf(ranked, chosenId),
    regretMs2: chosen.incrementalCostMs2 - best.incrementalCostMs2,
    ...outcomes(observation, chosen, best),
    ...jevSignals(record),
  };
};

const outcomes = (observation: Observation, chosen: RankedCandidate, best: RankedCandidate) => ({
  chosen: summaryOf(observation, chosen.candidate),
  best: summaryOf(observation, best.candidate),
});

/** Replays the log; the wrapped replay policy sees every observation the original policy saw. */
const observingReplay = (log: RunLog, key: RunKey, records: DecisionDiagnostic[]): Policy => {
  const replay = createReplayPolicy(log);
  const context: RunContext = { ...key, policyId: log.policy.id, scenarioId: log.scenarioId };
  let index = 0;
  return {
    descriptor: replay.descriptor,
    decide: (observation: Observation) => {
      const record = log.decisions[index];
      index += 1;
      if (record?.outcome.status === "accepted") {
        records.push(diagnostic(context, record, observation));
      }
      return replay.decide(observation);
    },
  };
};

export const diagnoseRun = async (
  inputs: Inputs,
  log: RunLog,
  key: RunKey,
): Promise<DecisionDiagnostic[]> => {
  const records: DecisionDiagnostic[] = [];
  const replayed = await runSimulation(
    inputs.scenario,
    inputs.map,
    observingReplay(log, key, records),
  );
  if (replayed.termination.kind === "failed" && replayed.termination.reason === "policyError") {
    throw new Error(`replay failed: ${replayed.termination.detail}`);
  }
  return records;
};

const inputsFor = (suite: LoadedSuite, run: SuiteRun): Inputs => {
  const scenario = suite.scenarios.get(run.scenario.id);
  const map = scenario === undefined ? undefined : suite.maps.get(run.scenario.mapId);
  if (scenario === undefined || map === undefined) {
    throw new Error(`suite is missing scenario "${run.scenario.id}" or its map`);
  }
  return { scenario, map };
};

/** Every complete run listed in a suite output directory, diagnosed. */
export const diagnoseSuiteDirectory = async (
  suite: LoadedSuite,
  suiteDir: string,
): Promise<DecisionDiagnostic[]> => {
  const index = await readJsonFile(path.join(suiteDir, SUITE_INDEX_FILE), suiteIndexSchema);
  if (!index.ok) {
    throw new Error(`cannot read ${path.join(suiteDir, SUITE_INDEX_FILE)}`);
  }
  const records: DecisionDiagnostic[] = [];
  for (const run of index.value.runs.filter((item) => item.status === "complete")) {
    const log = await readJsonFile(path.join(suiteDir, run.dir, RUN_LOG_FILE), runLogSchema);
    if (!log.ok) {
      throw new Error(`cannot read run log in ${run.dir}`);
    }
    const key = { load: run.scenario.load, repetition: run.repetition };
    records.push(...(await diagnoseRun(inputsFor(suite, run), log.value, key)));
  }
  return records;
};
