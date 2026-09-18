import { type SuiteIndex } from "@bus20/contracts/suite-index";
import {
  type CellSummary,
  type CrossCitySummary,
  type PairedSummary,
  summarizeAcrossCities,
  summarizeCells,
  summarizePaired,
} from "./aggregate.js";
import { type Interval } from "./statistics.js";

export const ANALYSIS_VERSION = "bus20-analysis/1" as const;

export interface Analysis {
  readonly analysisVersion: typeof ANALYSIS_VERSION;
  readonly benchmarkVersion: string;
  readonly manifestDigest: string;
  readonly referencePolicyId: string;
  readonly bootstrapSeed: number;
  readonly cells: readonly CellSummary[];
  readonly paired: readonly PairedSummary[];
  readonly acrossCities: readonly CrossCitySummary[];
}

export const analyzeSuite = (
  index: SuiteIndex,
  referencePolicyId: string,
  seed: number,
): Analysis => {
  const cells = summarizeCells(index, seed);
  return {
    analysisVersion: ANALYSIS_VERSION,
    benchmarkVersion: index.benchmarkVersion,
    manifestDigest: index.manifestDigest,
    referencePolicyId,
    bootstrapSeed: seed,
    cells,
    paired: summarizePaired(index, referencePolicyId, seed),
    acrossCities: summarizeAcrossCities(cells),
  };
};

const num = (value: number | null, digits = 2): string =>
  value === null ? "n/a" : value.toFixed(digits);
const pct = (value: number): string => `${(100 * value).toFixed(0)}%`;
const interval = (value: Interval | null): string =>
  value === null ? "n/a" : `[${value.lower.toFixed(2)}, ${value.upper.toFixed(2)}]`;
const reasons = (counts: Readonly<Record<string, number>>): string =>
  Object.entries(counts)
    .map(([reason, count]) => `${reason}:${count}`)
    .join(" ") || "-";

const cellRow = (cell: CellSummary): string =>
  `| ${cell.policyId} | ${cell.city} | ${cell.load} | ${cell.runs} | ${pct(cell.successRate)} | ` +
  `${num(cell.conditionalMeanPain)} | ${interval(cell.painInterval)} | ${num(cell.meanCostUsd, 4)} | ` +
  `${cell.meanLatencyMedianMs.toFixed(0)} | ${reasons(cell.failureReasons)} |`;

const cellsTable = (cells: readonly CellSummary[]): string =>
  [
    "| policy | city | load | runs | success | pain (complete only) | 95% CI | mean cost (USD) | latency p50 (ms) | failures |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...cells.map(cellRow),
  ].join("\n");

const pairedRow = (row: PairedSummary): string =>
  `| ${row.policyId} | ${row.city} | ${row.load} | ${row.pairs} | ${row.bothComplete} | ` +
  `${row.onlyReferenceComplete} | ${row.onlyPolicyComplete} | ${num(row.meanDifference)} | ` +
  `${interval(row.differenceInterval)} | ${num(row.meanImprovementPercent, 1)} | ` +
  `${row.policyWins}/${row.bothComplete} |`;

const pairedTable = (paired: readonly PairedSummary[]): string =>
  [
    "| policy | city | load | pairs | both complete | only ref | only policy | mean diff (ref - policy) | 95% CI | mean improvement % | policy wins |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...paired.map(pairedRow),
  ].join("\n");

const acrossTable = (rows: readonly CrossCitySummary[]): string =>
  [
    "| policy | load | cities | success (equal-weight) | pain (equal-weight, complete only) |",
    "| --- | --- | --- | --- | --- |",
    ...rows.map(
      (row) =>
        `| ${row.policyId} | ${row.load} | ${row.cities} | ${pct(row.successRate)} | ` +
        `${num(row.conditionalMeanPain)} |`,
    ),
  ].join("\n");

const section = (title: string, note: string, table: string): string[] => [
  `## ${title}`,
  "",
  note,
  "",
  table,
  "",
];

const PAIRED_NOTE =
  "Diff is reference pain minus policy pain on the same scenario and repetition; positive " +
  "favours the policy. Improvement % uses the reference pain as denominator and is omitted when it is 0.";

/** Markdown artifact. Success rates come first; conditional means are labelled. */
export const analysisMarkdown = (analysis: Analysis): string =>
  [
    `# Benchmark analysis: ${analysis.benchmarkVersion}`,
    "",
    `Manifest ${analysis.manifestDigest}. Reference policy: ${analysis.referencePolicyId}. ` +
      `Bootstrap seed ${analysis.bootstrapSeed}, 95% percentile intervals over scenarios.`,
    "",
    ...section(
      "Per cell (policy x city x load)",
      "Pain is reported over complete runs only; read it together with the success rate.",
      cellsTable(analysis.cells),
    ),
    ...section("Paired against the reference", PAIRED_NOTE, pairedTable(analysis.paired)),
    ...section(
      "Across cities (equal weight per city)",
      "Each city contributes equally regardless of its request count.",
      acrossTable(analysis.acrossCities),
    ),
  ].join("\n");
