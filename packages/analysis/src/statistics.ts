import { createRng } from "@bus20/contracts/random";

export const mean = (values: readonly number[]): number =>
  values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;

export interface Interval {
  readonly lower: number;
  readonly upper: number;
}

const DEFAULT_RESAMPLES = 2000;
const ALPHA = 0.05;

const percentile = (sorted: readonly number[], fraction: number): number => {
  const rank = Math.min(sorted.length, Math.max(1, Math.ceil(fraction * sorted.length)));
  return sorted[rank - 1] ?? 0;
};

/**
 * Seeded percentile bootstrap of the mean. Resampling units are whatever the
 * caller passes (scenario-level values, never per-passenger values), so the
 * interval reflects scenario-to-scenario variation.
 */
export const bootstrapMeanInterval = (
  values: readonly number[],
  seed: number,
  resamples = DEFAULT_RESAMPLES,
): Interval | null => {
  if (values.length < 2) {
    return null;
  }
  const rng = createRng(seed);
  const means: number[] = [];
  for (let i = 0; i < resamples; i += 1) {
    const total = values.reduce((sum) => sum + (values[rng.int(values.length)] ?? 0), 0);
    means.push(total / values.length);
  }
  means.sort((left, right) => left - right);
  return { lower: percentile(means, ALPHA / 2), upper: percentile(means, 1 - ALPHA / 2) };
};
