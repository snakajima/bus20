import { type SampledRequest } from "@bus20/baselines/demand-history";
import { type MapDocument } from "@bus20/contracts/map";
import { type Candidate, type Observation } from "@bus20/contracts/observation";
import { createRng, type Rng, seedFromLabel } from "@bus20/contracts/random";
import { type ScenarioDocument } from "@bus20/contracts/scenario";
import { MS_PER_MINUTE } from "@bus20/contracts/time";
import { type Forecaster, type OptionForecast } from "@bus20/models/forecast-presentation";
import { Routing } from "@bus20/simulator/routing";
import { createKnownDemandModel } from "./rollout-demand.js";

/**
 * The `forecast` presentation's host side: sampled days from the scenario's
 * demand distribution (the same `known` model the rollout uses), reduced to
 * two numbers the model can read. Samples are seeded by the decision so a
 * run is reproducible; the day's stored requests are never read.
 */
export interface ForecastSettings {
  readonly samples: number;
  readonly horizonMinutes: number;
  /** A request counts as "nearby" when the vehicle can reach its origin within this many minutes. */
  readonly nearbyMinutes: number;
  readonly seed: number;
}

export const DEFAULT_FORECAST_SETTINGS: ForecastSettings = {
  samples: 32,
  horizonMinutes: 10,
  nearbyMinutes: 5,
  seed: 0,
};

interface Sampled {
  readonly key: string;
  readonly days: readonly (readonly SampledRequest[])[];
}

const finishOf = (candidate: Candidate): { nodeId: string; timeMs: number } => {
  const last = candidate.stops[candidate.stops.length - 1];
  if (last === undefined) {
    throw new Error(`candidate "${candidate.id}" has no stops`);
  }
  return { nodeId: last.nodeId, timeMs: last.plannedArrivalTimeMs };
};

const countIn = (
  days: readonly (readonly SampledRequest[])[],
  test: (request: SampledRequest) => boolean,
): number =>
  days.length === 0 ? 0 : days.reduce((sum, day) => sum + day.filter(test).length, 0) / days.length;

/** Sampled remaining days, drawn once per observation and shared by every option. */
class DaySampler {
  private cache: Sampled | undefined;

  constructor(
    private readonly sample: (rng: Rng, nowMs: number) => SampledRequest[],
    private readonly settings: ForecastSettings,
  ) {}

  daysFor(observation: Observation): readonly (readonly SampledRequest[])[] {
    const key = `${observation.scenarioId}:${observation.decisionRequestId}:${observation.stateVersion}`;
    if (this.cache?.key !== key) {
      const rng = createRng(seedFromLabel(this.settings.seed, key));
      const days = Array.from({ length: this.settings.samples }, () =>
        this.sample(rng, observation.nowMs),
      );
      this.cache = { key, days };
    }
    return this.cache.days;
  }
}

const nearbyAfter = (
  routing: Routing,
  settings: ForecastSettings,
  finish: { nodeId: string; timeMs: number },
): ((request: SampledRequest) => boolean) => {
  const horizonMs = settings.horizonMinutes * MS_PER_MINUTE;
  const nearbyMs = settings.nearbyMinutes * MS_PER_MINUTE;
  return (r) =>
    r.requestTimeMs > finish.timeMs &&
    r.requestTimeMs <= finish.timeMs + horizonMs &&
    (routing.travelTimeMs(finish.nodeId, r.originNodeId) ?? Number.POSITIVE_INFINITY) <= nearbyMs;
};

const optionForecastOf = (
  routing: Routing,
  sampler: DaySampler,
  settings: ForecastSettings,
  observation: Observation,
  candidate: Candidate,
): OptionForecast => {
  const finish = finishOf(candidate);
  return {
    vehicleFreeInMinutes: Math.round((finish.timeMs - observation.nowMs) / MS_PER_MINUTE),
    expectedNearbyRequests: countIn(
      sampler.daysFor(observation),
      nearbyAfter(routing, settings, finish),
    ),
  };
};

const forecasterOf = (
  routing: Routing,
  sampler: DaySampler,
  settings: ForecastSettings,
): Forecaster => {
  const horizonMs = settings.horizonMinutes * MS_PER_MINUTE;
  return {
    expectedRequests: (observation) =>
      countIn(
        sampler.daysFor(observation),
        (r) => r.requestTimeMs <= observation.nowMs + horizonMs,
      ),
    optionForecast: (observation, candidate) =>
      optionForecastOf(routing, sampler, settings, observation, candidate),
  };
};

export const createKnownForecaster = (
  map: MapDocument,
  scenario: ScenarioDocument,
  settings: ForecastSettings = DEFAULT_FORECAST_SETTINGS,
): Forecaster | undefined => {
  const demand = createKnownDemandModel(map, scenario);
  if (demand === undefined) {
    return undefined;
  }
  const sampler = new DaySampler(
    (rng, nowMs) => demand.sampleFuture(rng, nowMs, scenario.demandEndTimeMs),
    settings,
  );
  return forecasterOf(new Routing(map), sampler, settings);
};
