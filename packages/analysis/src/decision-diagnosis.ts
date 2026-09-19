import { MS_PER_MINUTE } from "@bus20/contracts/time";
import { mean } from "./statistics.js";

/**
 * Decision-level diagnosis. Run pain is chaotic (one early choice changes
 * the whole day), so this looks at every decision on its own: where the
 * chosen candidate ranked under the insertion rule, how much immediate
 * squared delay it gave away against the rule's best (myopic regret), and
 * in which direction it erred. Records come from replaying stored runs.
 */
export interface ConsequenceSummary {
  readonly waitMinutes: number;
  readonly detourMinutes: number;
  readonly othersDelayed: number;
  readonly largestDelayMinutes: number;
}

export interface DecisionDiagnostic {
  readonly policyId: string;
  readonly scenarioId: string;
  readonly load: string;
  readonly repetition: number;
  readonly requestId: string;
  readonly candidates: number;
  /** 0 = the rule's best; ties share the lowest rank of their cost. */
  readonly rank: number;
  /** Chosen incremental cost minus the best, ms². */
  readonly regretMs2: number;
  readonly chosen: ConsequenceSummary;
  readonly best: ConsequenceSummary;
  /** Jev only. */
  readonly confidence?: number;
  readonly chosenProbability?: number;
}

export interface GroupSummary {
  readonly policyId: string;
  readonly group: string;
  readonly decisions: number;
  readonly bestShare: number;
  readonly top3Share: number;
  readonly bottomHalfShare: number;
  /** Mean of rank/(candidates-1): 0 is always best, 0.5 is uniform random. */
  readonly meanNormalizedRank: number;
  readonly meanRegretMin2: number;
  readonly medianRegretMin2: number;
  readonly p90RegretMin2: number;
  /** Chosen minus best, averaged: how the policy errs when it errs. */
  readonly waitBias: number;
  readonly detourBias: number;
  readonly othersDelayedBias: number;
  readonly largestDelayBias: number;
}

export interface Diagnosis {
  readonly overall: GroupSummary[];
  readonly byLoad: GroupSummary[];
  readonly byCandidateBucket: GroupSummary[];
  readonly byConfidenceQuartile: GroupSummary[];
}

const MS2_PER_MIN2 = MS_PER_MINUTE * MS_PER_MINUTE;

const CANDIDATE_BUCKETS: readonly (readonly [string, number, number])[] = [
  ["1-10", 1, 10],
  ["11-40", 11, 40],
  ["41-100", 41, 100],
  ["101+", 101, Number.POSITIVE_INFINITY],
];

export const candidateBucket = (candidates: number): string =>
  CANDIDATE_BUCKETS.find(([, low, high]) => candidates >= low && candidates <= high)?.[0] ?? "?";

const share = (records: readonly DecisionDiagnostic[], test: (r: DecisionDiagnostic) => boolean) =>
  records.length === 0 ? 0 : records.filter(test).length / records.length;

const sortedPercentile = (values: readonly number[], fraction: number): number => {
  const sorted = [...values].sort((left, right) => left - right);
  const rank = Math.min(sorted.length, Math.max(1, Math.ceil(fraction * sorted.length)));
  return sorted[rank - 1] ?? 0;
};

const bias = (records: readonly DecisionDiagnostic[], field: keyof ConsequenceSummary): number =>
  mean(records.map((r) => r.chosen[field] - r.best[field]));

const rankMeasures = (records: readonly DecisionDiagnostic[]) => ({
  bestShare: share(records, (r) => r.rank === 0),
  top3Share: share(records, (r) => r.rank < 3),
  bottomHalfShare: share(records, (r) => r.candidates > 1 && r.rank >= r.candidates / 2),
  meanNormalizedRank: mean(
    records.filter((r) => r.candidates > 1).map((r) => r.rank / (r.candidates - 1)),
  ),
});

const regretMeasures = (records: readonly DecisionDiagnostic[]) => {
  const regrets = records.map((r) => r.regretMs2 / MS2_PER_MIN2);
  return {
    meanRegretMin2: mean(regrets),
    medianRegretMin2: sortedPercentile(regrets, 0.5),
    p90RegretMin2: sortedPercentile(regrets, 0.9),
  };
};

export const summarizeGroup = (
  policyId: string,
  group: string,
  records: readonly DecisionDiagnostic[],
): GroupSummary => ({
  policyId,
  group,
  decisions: records.length,
  ...rankMeasures(records),
  ...regretMeasures(records),
  waitBias: bias(records, "waitMinutes"),
  detourBias: bias(records, "detourMinutes"),
  othersDelayedBias: bias(records, "othersDelayed"),
  largestDelayBias: bias(records, "largestDelayMinutes"),
});

const groupBy = (
  records: readonly DecisionDiagnostic[],
  key: (r: DecisionDiagnostic) => string,
): Map<string, DecisionDiagnostic[]> => {
  const groups = new Map<string, DecisionDiagnostic[]>();
  for (const record of records) {
    const label = key(record);
    groups.set(label, [...(groups.get(label) ?? []), record]);
  }
  return groups;
};

const summarizeBy = (
  records: readonly DecisionDiagnostic[],
  key: (r: DecisionDiagnostic) => string,
): GroupSummary[] =>
  [...groupBy(records, (r) => r.policyId)].flatMap(([policyId, own]) =>
    [...groupBy(own, key)].map(([group, items]) => summarizeGroup(policyId, group, items)),
  );

const QUARTILES = ["q1 (lowest)", "q2", "q3", "q4 (highest)"] as const;

/** Confidence quartiles are computed per policy, over that policy's own decisions. */
const confidenceQuartile = (
  records: readonly DecisionDiagnostic[],
): ((r: DecisionDiagnostic) => string) => {
  const cuts = new Map<string, number[]>();
  for (const [policyId, own] of groupBy(records, (r) => r.policyId)) {
    const values = own.map((r) => r.confidence ?? 0).sort((left, right) => left - right);
    cuts.set(
      policyId,
      [0.25, 0.5, 0.75].map((fraction) => sortedPercentile(values, fraction)),
    );
  }
  return (r) => {
    const edges = cuts.get(r.policyId) ?? [];
    const index = edges.filter((edge) => (r.confidence ?? 0) > edge).length;
    return QUARTILES[index] ?? QUARTILES[3];
  };
};

export const summarizeDecisions = (records: readonly DecisionDiagnostic[]): Diagnosis => {
  const withConfidence = records.filter((r) => r.confidence !== undefined);
  return {
    overall: summarizeBy(records, () => "all"),
    byLoad: summarizeBy(records, (r) => r.load),
    byCandidateBucket: summarizeBy(records, (r) => candidateBucket(r.candidates)),
    byConfidenceQuartile: summarizeBy(withConfidence, confidenceQuartile(withConfidence)),
  };
};

const pct = (value: number): string => `${(100 * value).toFixed(1)}%`;
const fixed = (value: number): string => value.toFixed(2);
const signed = (value: number): string => `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;

const HEADER =
  "| policy | group | decisions | best | top 3 | bottom half | norm. rank | regret mean | median | p90 | wait bias | detour bias | others delayed bias | largest delay bias |\n" +
  "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |";

const row = (s: GroupSummary): string =>
  `| ${s.policyId} | ${s.group} | ${s.decisions} | ${pct(s.bestShare)} | ${pct(s.top3Share)} | ${pct(s.bottomHalfShare)} | ${fixed(s.meanNormalizedRank)} | ${fixed(s.meanRegretMin2)} | ${fixed(s.medianRegretMin2)} | ${fixed(s.p90RegretMin2)} | ${signed(s.waitBias)} | ${signed(s.detourBias)} | ${signed(s.othersDelayedBias)} | ${signed(s.largestDelayBias)} |`;

const section = (title: string, note: string, rows: readonly GroupSummary[]): string =>
  rows.length === 0 ? "" : `## ${title}\n\n${note}\n\n${HEADER}\n${rows.map(row).join("\n")}\n\n`;

export const diagnosisMarkdown = (diagnosis: Diagnosis): string =>
  "# Decision diagnosis\n\n" +
  "Every decision of every stored run, replayed and scored against the insertion rule. " +
  "Rank 0 is the rule's cheapest insertion; regret is the immediate squared delay given away " +
  "against it, in min²; normalized rank 0.5 is what uniform random choice would score. " +
  "Biases are chosen minus best, in minutes or passengers, averaged over all decisions.\n\n" +
  section("Overall", "All loads, all candidate counts.", diagnosis.overall) +
  section("By load", "Same measures per load level.", diagnosis.byLoad) +
  section(
    "By number of candidates offered",
    "Whether quality degrades as the choice set grows.",
    diagnosis.byCandidateBucket,
  ) +
  section(
    "By reported confidence (Jev)",
    "Quartiles of the model's own confidence; a useful signal shows falling regret from q1 to q4.",
    diagnosis.byConfidenceQuartile,
  );
