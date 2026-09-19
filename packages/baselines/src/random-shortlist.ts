import { type PolicyDescriptor } from "@bus20/contracts/run-log";
import { createRng, seedFromLabel } from "@bus20/contracts/random";
import { ACTION_SCHEMA_VERSION } from "@bus20/contracts/versions";
import { type Candidate, type Observation } from "@bus20/contracts/observation";
import { type Decision, type Policy } from "@bus20/simulator/policy";
import { shortlistByCost } from "./insertion-rule.js";

/**
 * The floor for shortlisted conditions: picks uniformly at random among the
 * insertion rule's `shortlist` cheapest insertions. Whatever a model scores
 * above this is judgement it adds; whatever it scores above the full-set
 * random floor but not above this came from the shortlist itself.
 * Seeded per decision, so runs are deterministic per seed and replay.
 */
export const RANDOM_REFERENCE_TOOL_VERSION = "bus20-random-reference/1" as const;
export const RANDOM_REFERENCE_KIND = "random-reference" as const;

export interface RandomShortlistOptions {
  /** Candidates kept from the rule's ranking; omit to draw from every legal insertion. */
  readonly shortlist?: number;
  readonly seed?: number;
}

const poolLabel = (shortlist: number | undefined): string =>
  shortlist === undefined ? "all" : `top${shortlist}`;

const describe = (options: RandomShortlistOptions, seed: number): PolicyDescriptor => ({
  id: `random-reference:${poolLabel(options.shortlist)}`,
  kind: RANDOM_REFERENCE_KIND,
  toolVersion: RANDOM_REFERENCE_TOOL_VERSION,
  settings: { seed, ...(options.shortlist === undefined ? {} : { shortlist: options.shortlist }) },
});

const poolOf = (observation: Observation, shortlist: number | undefined): Candidate[] =>
  shortlist === undefined
    ? [...observation.candidates]
    : shortlistByCost(observation, shortlist).map((item) => item.candidate);

const decideRandomly = (
  observation: Observation,
  shortlist: number | undefined,
  seed: number,
): Decision => {
  const pool = poolOf(observation, shortlist);
  const rng = createRng(
    seedFromLabel(seed, `${observation.scenarioId}:${observation.decisionRequestId}`),
  );
  return {
    action: {
      schemaVersion: ACTION_SCHEMA_VERSION,
      kind: "chooseCandidate",
      stateVersion: observation.stateVersion,
      candidateId: rng.pick(pool).id,
    },
    usage: { candidatesEvaluated: observation.candidates.length, shortlisted: pool.length },
  };
};

export const createRandomShortlistPolicy = (options: RandomShortlistOptions = {}): Policy => {
  const seed = options.seed ?? 0;
  return {
    descriptor: describe(options, seed),
    decide: (observation) => Promise.resolve(decideRandomly(observation, options.shortlist, seed)),
  };
};
