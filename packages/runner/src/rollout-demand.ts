import {
  type DemandModel,
  labelSamples,
  type SampledRequest,
} from "@bus20/baselines/demand-history";
import { type MapDocument } from "@bus20/contracts/map";
import { type Rng } from "@bus20/contracts/random";
import { type ScenarioDocument } from "@bus20/contracts/scenario";
import { demandDistributionOf, sampleDemandDay } from "@bus20/datasets/demand";

export const KNOWN_DEMAND_LABEL = "known" as const;
export const ROLLOUT_DEMAND_MODELS = ["empirical", KNOWN_DEMAND_LABEL] as const;
export type RolloutDemandModel = (typeof ROLLOUT_DEMAND_MODELS)[number];
/** The informed model is the stronger baseline (results/synthetic-dev-2/dev-rollout), so it is the default. */
export const DEFAULT_ROLLOUT_DEMAND: RolloutDemandModel = KNOWN_DEMAND_LABEL;

/**
 * The informed variant: the rollout knows the generator's demand
 * distribution (pattern and zones), as a dispatcher with historical data
 * would, and imagines fresh days from it. Each sample is a whole new day
 * clipped to the horizon, so bursts and commute peaks fall at their usual
 * times. The stored requests of this day are never read.
 */
export const createKnownDemandModel = (
  map: MapDocument,
  scenario: ScenarioDocument,
): DemandModel | undefined => {
  const distribution = demandDistributionOf(scenario);
  if (distribution === undefined) {
    return undefined;
  }
  return {
    label: KNOWN_DEMAND_LABEL,
    observe: () => undefined,
    sampleFuture: (rng: Rng, nowMs: number, untilMs: number): SampledRequest[] =>
      labelSamples(
        sampleDemandDay(map, distribution, rng).filter(
          (draw) => draw.requestTimeMs > nowMs && draw.requestTimeMs <= untilMs,
        ),
      ),
  };
};
