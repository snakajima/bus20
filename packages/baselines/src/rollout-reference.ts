import { type JsonValue } from "@bus20/contracts/json-value";
import { type MapDocument } from "@bus20/contracts/map";
import { type Candidate, type Observation } from "@bus20/contracts/observation";
import { createRng, type Rng, seedFromLabel } from "@bus20/contracts/random";
import { type PolicyDescriptor } from "@bus20/contracts/run-log";
import { MS_PER_MINUTE } from "@bus20/contracts/time";
import { ACTION_SCHEMA_VERSION } from "@bus20/contracts/versions";
import { type Decision, type Policy } from "@bus20/simulator/policy";
import { Routing } from "@bus20/simulator/routing";
import { DemandHistory, type DemandModel, type SampledRequest } from "./demand-history.js";
import { type RankedCandidate, shortlistByCost } from "./insertion-rule.js";
import {
  advanceWorld,
  insertGreedily,
  totalCostMs2,
  type WorldRequest,
  worldFromObservation,
} from "./rollout-world.js";

/**
 * Rollout reference: a stronger classical dispatcher than the insertion
 * rule. It shortlists the cheapest insertions by the rule, then scores each
 * by simulating sampled futures (Poisson arrivals at the observed rate,
 * trips bootstrapped from the run's own history) in which later requests are
 * served by the rule, and commits the candidate with the lowest mean total
 * squared delay. The same sampled futures are used for every candidate
 * (common random numbers). It knows the road map, the end of the demand
 * window, and a demand model: by default its own history in this run, or the
 * generator's distribution when the runner supplies it (`known`). Unreleased
 * requests are never consulted.
 */
export const ROLLOUT_REFERENCE_TOOL_VERSION = "bus20-rollout-reference/1" as const;
export const ROLLOUT_REFERENCE_KIND = "rollout-reference" as const;

export interface RolloutReferenceOptions {
  readonly map: MapDocument;
  /** End of the service's demand window; sampled arrivals never go past it. */
  readonly demandEndTimeMs: number;
  /** How futures are imagined; defaults to the empirical model built from the run's own history. */
  readonly demand?: DemandModel;
  /** Candidates kept from the insertion-rule ranking. */
  readonly shortlist?: number;
  /** Sampled futures per decision; 0 reduces the policy to the insertion rule. */
  readonly samples?: number;
  readonly horizonMinutes?: number;
  readonly seed?: number;
}

interface Settings {
  readonly demand: string;
  readonly shortlist: number;
  readonly samples: number;
  readonly horizonMinutes: number;
  readonly seed: number;
}

/**
 * Defaults from the dev pilots (results/pilot/rollout): eight shortlisted
 * insertions, 64 sampled futures of ten minutes. More samples mainly reduce
 * seed-to-seed variance; longer horizons did not help.
 */
export const DEFAULT_ROLLOUT_SETTINGS: Omit<Settings, "demand"> = {
  shortlist: 8,
  samples: 64,
  horizonMinutes: 10,
  seed: 0,
};

const describe = (settings: Settings): PolicyDescriptor => ({
  // The seed is a setting, not part of the id, so repetitions with different seeds group together.
  id: `rollout-reference:${settings.demand}:k${settings.shortlist}:s${settings.samples}:h${settings.horizonMinutes}`,
  kind: ROLLOUT_REFERENCE_KIND,
  toolVersion: ROLLOUT_REFERENCE_TOOL_VERSION,
  settings: { ...settings },
});

const toWorldRequest = (routing: Routing, sampled: SampledRequest): WorldRequest => ({
  ...sampled,
  directTravelTimeMs: routing.travelTimeMs(sampled.originNodeId, sampled.destinationNodeId) ?? 0,
});

/** Total squared delay of everyone (known and sampled) after one simulated future. */
const rolloutCostMs2 = (
  routing: Routing,
  observation: Observation,
  candidate: Candidate,
  future: readonly WorldRequest[],
): number => {
  const world = worldFromObservation(observation, candidate);
  for (const request of future) {
    advanceWorld(routing, world, request.requestTimeMs);
    insertGreedily(routing, world, request);
  }
  return totalCostMs2(routing, world);
};

interface Scored extends RankedCandidate {
  readonly meanRolloutCostMs2: number;
}

const scoreCandidate = (
  routing: Routing,
  observation: Observation,
  ranked: RankedCandidate,
  futures: readonly (readonly WorldRequest[])[],
): Scored => {
  const total = futures.reduce(
    (sum, future) => sum + rolloutCostMs2(routing, observation, ranked.candidate, future),
    0,
  );
  return { ...ranked, meanRolloutCostMs2: futures.length === 0 ? 0 : total / futures.length };
};

/** Lowest mean rollout cost wins; ties keep the insertion-rule order. */
const pickBest = (scored: readonly Scored[]): Scored => {
  const [first] = scored;
  if (first === undefined) {
    throw new Error("no legal candidates were offered");
  }
  return scored.reduce(
    (best, item) => (item.meanRolloutCostMs2 < best.meanRolloutCostMs2 ? item : best),
    first,
  );
};

interface Context {
  readonly routing: Routing;
  readonly demand: DemandModel;
  readonly settings: Settings;
  readonly demandEndTimeMs: number;
}

const sampleFutures = (
  context: Context,
  rng: Rng,
  observation: Observation,
): (readonly WorldRequest[])[] => {
  const { routing, demand, settings } = context;
  const untilMs = Math.min(
    context.demandEndTimeMs,
    observation.nowMs + settings.horizonMinutes * MS_PER_MINUTE,
  );
  return Array.from({ length: settings.samples }, () =>
    demand
      .sampleFuture(rng, observation.nowMs, untilMs)
      .map((sampled) => toWorldRequest(routing, sampled)),
  );
};

const decideWith = (context: Context, observation: Observation): Decision => {
  const { routing, demand, settings } = context;
  demand.observe(observation);
  const ranked = shortlistByCost(observation, settings.shortlist);
  const rng = createRng(
    seedFromLabel(settings.seed, `${observation.scenarioId}:${observation.decisionRequestId}`),
  );
  const futures = sampleFutures(context, rng, observation);
  const scored = ranked.map((item) => scoreCandidate(routing, observation, item, futures));
  return toDecision(observation, scored, pickBest(scored), futures);
};

const usageOf = (
  observation: Observation,
  scored: readonly Scored[],
  chosen: Scored,
  futures: readonly (readonly WorldRequest[])[],
): Readonly<Record<string, number>> => {
  const sampledArrivals = futures.reduce((sum, future) => sum + future.length, 0);
  return {
    candidatesEvaluated: observation.candidates.length,
    shortlisted: scored.length,
    samples: futures.length,
    meanSampledArrivals: futures.length === 0 ? 0 : sampledArrivals / futures.length,
    incrementalCostMs2: chosen.incrementalCostMs2,
    meanRolloutCostMs2: chosen.meanRolloutCostMs2,
    changedFromMyopic: chosen.candidate.id === scored[0]?.candidate.id ? 0 : 1,
  };
};

const traceOf = (scored: readonly Scored[]): Record<string, JsonValue> => ({
  myopicChoice: scored[0]?.candidate.id ?? null,
  shortlist: scored.map((item) => ({
    id: item.candidate.id,
    incrementalCostMs2: item.incrementalCostMs2,
    meanRolloutCostMs2: item.meanRolloutCostMs2,
  })),
});

const toDecision = (
  observation: Observation,
  scored: readonly Scored[],
  chosen: Scored,
  futures: readonly (readonly WorldRequest[])[],
): Decision => ({
  action: {
    schemaVersion: ACTION_SCHEMA_VERSION,
    kind: "chooseCandidate",
    stateVersion: observation.stateVersion,
    candidateId: chosen.candidate.id,
  },
  usage: usageOf(observation, scored, chosen, futures),
  trace: traceOf(scored),
});

const settingsOf = (options: RolloutReferenceOptions, demand: DemandModel): Settings => ({
  demand: demand.label,
  shortlist: Math.max(1, Math.floor(options.shortlist ?? DEFAULT_ROLLOUT_SETTINGS.shortlist)),
  samples: Math.max(0, Math.floor(options.samples ?? DEFAULT_ROLLOUT_SETTINGS.samples)),
  horizonMinutes: options.horizonMinutes ?? DEFAULT_ROLLOUT_SETTINGS.horizonMinutes,
  seed: options.seed ?? DEFAULT_ROLLOUT_SETTINGS.seed,
});

/** Decisions are deterministic: the sample stream is seeded by scenario and request, never by wall time. */
export const createRolloutReferencePolicy = (options: RolloutReferenceOptions): Policy => {
  const demand = options.demand ?? new DemandHistory();
  const context: Context = {
    routing: new Routing(options.map),
    demand,
    settings: settingsOf(options, demand),
    demandEndTimeMs: options.demandEndTimeMs,
  };
  return {
    descriptor: describe(context.settings),
    decide: (observation) => Promise.resolve(decideWith(context, observation)),
  };
};
