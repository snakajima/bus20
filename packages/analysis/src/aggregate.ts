import { type SuiteIndex, type SuiteRun } from "@bus20/contracts/suite-index";
import { bootstrapMeanInterval, type Interval, mean } from "./statistics.js";

/** Aggregation unit: one policy on one (city, load) cell. */
export interface CellKey {
  readonly policyId: string;
  readonly city: string;
  readonly load: string;
}

export interface CellSummary extends CellKey {
  readonly runs: number;
  readonly completeRuns: number;
  readonly successRate: number;
  /**
   * Mean pain over complete runs only. It is a conditional statistic: when
   * successRate < 1 it excludes failures and must be labelled as such.
   */
  readonly conditionalMeanPain: number | null;
  readonly painInterval: Interval | null;
  readonly meanCostUsd: number | null;
  readonly meanLatencyMedianMs: number;
  readonly failureReasons: Readonly<Record<string, number>>;
}

/** One scenario-repetition where both the reference and the policy completed. */
export interface PairedDifference {
  readonly scenarioId: string;
  readonly repetition: number;
  readonly referencePain: number;
  readonly policyPain: number;
  /** reference minus policy; positive means the policy did better. */
  readonly difference: number;
  /** 100 × difference / referencePain, or null when the reference pain is 0. */
  readonly improvementPercent: number | null;
}

export interface PairedSummary extends CellKey {
  readonly referencePolicyId: string;
  readonly pairs: number;
  readonly bothComplete: number;
  readonly onlyReferenceComplete: number;
  readonly onlyPolicyComplete: number;
  readonly meanDifference: number | null;
  readonly differenceInterval: Interval | null;
  readonly meanImprovementPercent: number | null;
  readonly policyWins: number;
}

const KEY_SEPARATOR = "|";

const cellKeyOf = (policyId: string, city: string, load: string): string =>
  [policyId, city, load].join(KEY_SEPARATOR);

const cellKey = (run: SuiteRun): string =>
  cellKeyOf(run.policy.id, run.scenario.city, run.scenario.load);

const groupBy = <T>(items: readonly T[], key: (item: T) => string): Map<string, T[]> => {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const list = groups.get(key(item)) ?? [];
    list.push(item);
    groups.set(key(item), list);
  }
  return groups;
};

const countReasons = (runs: readonly SuiteRun[]): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const run of runs) {
    if (run.failureReason !== null) {
      counts[run.failureReason] = (counts[run.failureReason] ?? 0) + 1;
    }
  }
  return counts;
};

const keyOf = (run: SuiteRun): CellKey => ({
  policyId: run.policy.id,
  city: run.scenario.city,
  load: run.scenario.load,
});

const meanOrNull = (values: readonly number[]): number | null =>
  values.length === 0 ? null : mean(values);

const summarizeCell = (runs: readonly SuiteRun[], seed: number): CellSummary => {
  const [first] = runs;
  if (first === undefined) {
    throw new Error("empty cell");
  }
  const complete = runs.filter((run) => run.status === "complete");
  const pains = complete.flatMap((run) => (run.pain === null ? [] : [run.pain]));
  const costs = complete.flatMap((run) => (run.costUsd === null ? [] : [run.costUsd]));
  return {
    ...keyOf(first),
    runs: runs.length,
    completeRuns: complete.length,
    successRate: complete.length / runs.length,
    conditionalMeanPain: meanOrNull(pains),
    painInterval: bootstrapMeanInterval(pains, seed),
    meanCostUsd: meanOrNull(costs),
    meanLatencyMedianMs: mean(runs.map((run) => run.latencyMedianMs)),
    failureReasons: countReasons(runs),
  };
};

export const summarizeCells = (index: SuiteIndex, seed: number): CellSummary[] =>
  [...groupBy(index.runs, cellKey).values()].map((runs, cellIndex) =>
    summarizeCell(runs, seed + cellIndex),
  );

const pairKey = (run: SuiteRun): string =>
  [run.scenario.id, String(run.repetition)].join(KEY_SEPARATOR);

type Pair = readonly [SuiteRun, SuiteRun];

const pairUp = (reference: readonly SuiteRun[], policy: readonly SuiteRun[]): Pair[] => {
  const byKey = new Map(policy.map((run) => [pairKey(run), run]));
  return reference.flatMap((run): Pair[] => {
    const partner = byKey.get(pairKey(run));
    return partner === undefined ? [] : [[run, partner]];
  });
};

const toDifference = ([reference, policy]: Pair): PairedDifference | undefined => {
  if (reference.pain === null || policy.pain === null) {
    return undefined;
  }
  const difference = reference.pain - policy.pain;
  return {
    scenarioId: reference.scenario.id,
    repetition: reference.repetition,
    referencePain: reference.pain,
    policyPain: policy.pain,
    difference,
    improvementPercent: reference.pain > 0 ? (100 * difference) / reference.pain : null,
  };
};

const summarizePairs = (
  key: CellKey,
  referencePolicyId: string,
  pairs: readonly Pair[],
  seed: number,
): PairedSummary => {
  const differences = pairs.flatMap((pair) => toDifference(pair) ?? []);
  const values = differences.map((item) => item.difference);
  const percents = differences.flatMap((item) => item.improvementPercent ?? []);
  return {
    ...key,
    referencePolicyId,
    ...countPairs(pairs),
    bothComplete: differences.length,
    meanDifference: meanOrNull(values),
    differenceInterval: bootstrapMeanInterval(values, seed),
    meanImprovementPercent: meanOrNull(percents),
    policyWins: values.filter((value) => value > 0).length,
  };
};

const countPairs = (pairs: readonly Pair[]) => ({
  pairs: pairs.length,
  onlyReferenceComplete: pairs.filter(([ref, pol]) => ref.pain !== null && pol.pain === null)
    .length,
  onlyPolicyComplete: pairs.filter(([ref, pol]) => ref.pain === null && pol.pain !== null).length,
});

/**
 * Paired comparison of every policy against the reference on identical
 * (scenario, repetition) pairs, per (city, load) cell. Pairs where either
 * side failed are counted, never dropped silently.
 */
export const summarizePaired = (
  index: SuiteIndex,
  referencePolicyId: string,
  seed: number,
): PairedSummary[] => {
  const cells = groupBy(index.runs, cellKey);
  const summaries: PairedSummary[] = [];
  for (const [cellIndex, runs] of [...cells.values()].entries()) {
    const [first] = runs;
    if (first === undefined || first.policy.id === referencePolicyId) {
      continue;
    }
    const key = keyOf(first);
    const reference = cells.get(cellKeyOf(referencePolicyId, key.city, key.load)) ?? [];
    summaries.push(
      summarizePairs(key, referencePolicyId, pairUp(reference, runs), seed + cellIndex),
    );
  }
  return summaries;
};

/** Equal-weight mean across cities of a per-cell statistic, per (policy, load). */
export interface CrossCitySummary {
  readonly policyId: string;
  readonly load: string;
  readonly cities: number;
  readonly successRate: number;
  /** Null unless every city has a conditional mean. */
  readonly conditionalMeanPain: number | null;
}

const acrossKey = (cell: CellSummary): string => [cell.policyId, cell.load].join(KEY_SEPARATOR);

export const summarizeAcrossCities = (cells: readonly CellSummary[]): CrossCitySummary[] =>
  [...groupBy(cells, acrossKey).values()].map((group) => {
    const pains = group.flatMap((cell) =>
      cell.conditionalMeanPain === null ? [] : [cell.conditionalMeanPain],
    );
    const [first] = group;
    return {
      policyId: first?.policyId ?? "",
      load: first?.load ?? "",
      cities: group.length,
      successRate: mean(group.map((cell) => cell.successRate)),
      conditionalMeanPain: pains.length === group.length && pains.length > 0 ? mean(pains) : null,
    };
  });
