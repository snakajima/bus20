import { type MapDocument } from "@bus20/contracts/map";
import { type Observation } from "@bus20/contracts/observation";
import { type DecisionRecord, type RunLog } from "@bus20/contracts/run-log";
import { type ScenarioDocument } from "@bus20/contracts/scenario";
import { type Decision, type Policy } from "./policy.js";
import { runSimulation } from "./run.js";

const describe = (requestId: string, stateVersion: number): string =>
  `${requestId}@${stateVersion}`;

const replayDecision = (
  record: DecisionRecord | undefined,
  ordinal: number,
  observation: Observation,
): Decision => {
  if (record === undefined) {
    throw new Error(`replay exhausted at decision ${ordinal}`);
  }
  if (
    record.stateVersion !== observation.stateVersion ||
    record.requestId !== observation.decisionRequestId
  ) {
    const expected = describe(record.requestId, record.stateVersion);
    const actual = describe(observation.decisionRequestId, observation.stateVersion);
    throw new Error(
      `replay mismatch at decision ${ordinal}: log has ${expected}, simulation is at ${actual}`,
    );
  }
  return { action: record.action };
};

/**
 * Replays recorded actions in order. The replayed run must present the same
 * (stateVersion, requestId) sequence, or the log does not belong to this
 * scenario/map/version and replay fails as a policy error.
 */
export const createReplayPolicy = (log: RunLog): Policy => {
  let index = 0;
  return {
    descriptor: log.policy,
    decide: (observation) => {
      index += 1;
      try {
        return Promise.resolve(replayDecision(log.decisions[index - 1], index, observation));
      } catch (error: unknown) {
        return Promise.reject(error instanceof Error ? error : new Error(String(error)));
      }
    },
  };
};

export interface ReplayVerdict {
  readonly matches: boolean;
  readonly differences: readonly string[];
  readonly replayed: RunLog;
}

const compareField = (label: string, expected: unknown, actual: unknown): string[] =>
  JSON.stringify(expected) === JSON.stringify(actual) ? [] : [`${label} differs`];

/** Re-runs a log's decisions and checks that journeys, termination, and state digest agree. */
export const verifyReplay = async (
  scenario: ScenarioDocument,
  map: MapDocument,
  log: RunLog,
): Promise<ReplayVerdict> => {
  const replayed = await runSimulation(scenario, map, createReplayPolicy(log));
  const differences = [
    ...compareField("termination", log.termination, replayed.termination),
    ...compareField("journeys", log.journeys, replayed.journeys),
    ...compareField("finalStateDigest", log.finalStateDigest, replayed.finalStateDigest),
  ];
  return { matches: differences.length === 0, differences, replayed };
};
