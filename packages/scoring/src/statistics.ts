export const mean = (values: readonly number[]): number =>
  values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;

/** Nearest-rank percentile on a copy sorted ascending. `fraction` is in (0, 1]. */
export const percentileNearestRank = (values: readonly number[], fraction: number): number => {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((left, right) => left - right);
  const rank = Math.min(sorted.length, Math.max(1, Math.ceil(fraction * sorted.length)));
  return sorted[rank - 1] ?? 0;
};

export const maximum = (values: readonly number[]): number =>
  values.length === 0 ? 0 : Math.max(...values);
