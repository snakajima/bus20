import {
  type AmortizationRow,
  type CampaignCurve,
  type GeneralizationRow,
  type ModeSummary,
  type Paper2Analysis,
} from "./campaigns.js";
import { type CellSummary, type PairedSummary } from "./aggregate.js";
import { type Interval } from "./statistics.js";

const num = (value: number | null, digits = 2): string =>
  value === null ? "n/a" : value.toFixed(digits);
const pct = (value: number | null): string =>
  value === null ? "n/a" : `${(100 * value).toFixed(0)}%`;
const interval = (value: Interval | null): string =>
  value === null ? "n/a" : `[${value.lower.toFixed(2)}, ${value.upper.toFixed(2)}]`;

const table = (header: readonly string[], rows: readonly (readonly string[])[]): string =>
  [
    `| ${header.join(" | ")} |`,
    `| ${header.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");

const modeRows = (modes: readonly ModeSummary[]): string[][] =>
  modes.map((mode) => [
    mode.mode,
    String(mode.campaigns),
    String(mode.selected),
    num(mode.meanGenerations, 1),
    num(mode.meanEvaluations, 1),
    num(mode.meanCostUsd, 4),
    num(mode.meanProgramCpuMs, 0),
    num(mode.meanIncumbentDevPain),
    pct(mode.meanTestSuccessRate),
    num(mode.meanTestConditionalPain),
  ]);

const curveRows = (curves: readonly CampaignCurve[]): string[][] =>
  curves.flatMap((curve) =>
    curve.points.map((point) => [
      curve.campaignId,
      String(point.iteration),
      point.accepted ? "yes" : "no",
      String(point.generations),
      String(point.evaluations),
      num(point.costUsd, 4),
      num(point.iterationDevPain),
      num(point.incumbentDevPain),
      pct(point.incumbentSuccessRate),
    ]),
  );

const cellRows = (cells: readonly CellSummary[]): string[][] =>
  cells.map((cell) => [
    cell.policyId,
    cell.city,
    cell.load,
    String(cell.runs),
    pct(cell.successRate),
    num(cell.conditionalMeanPain),
    interval(cell.painInterval),
  ]);

const pairedRows = (paired: readonly PairedSummary[]): string[][] =>
  paired.map((row) => [
    row.policyId,
    row.city,
    row.load,
    String(row.pairs),
    String(row.bothComplete),
    num(row.meanDifference),
    interval(row.differenceInterval),
    num(row.meanImprovementPercent, 1),
    `${row.policyWins}/${row.bothComplete}`,
  ]);

const generalizationRows = (rows: readonly GeneralizationRow[]): string[][] =>
  rows.map((row) => [
    row.campaignId,
    row.mode,
    row.group,
    String(row.runs),
    pct(row.successRate),
    num(row.conditionalMeanPain),
  ]);

const amortizationRows = (rows: readonly AmortizationRow[], ks: readonly string[]): string[][] =>
  rows.map((row) => [
    row.policyId,
    row.kind,
    num(row.preparationCostUsd, 4),
    num(row.perRunCostUsd, 4),
    num(row.perRunProgramCpuMs, 0),
    ...ks.map((k) => num(row.costPerRunByK[k] ?? null, 4)),
  ]);

const kColumns = (analysis: Paper2Analysis): string[] =>
  Object.keys(analysis.amortization[0]?.costPerRunByK ?? {});

const section = (title: string, note: string, body: string): string[] => [
  `## ${title}`,
  "",
  note,
  "",
  body,
  "",
];

const MODE_HEADER = [
  "mode",
  "campaigns",
  "selected",
  "generations",
  "evaluations",
  "cost (USD)",
  "program CPU (ms)",
  "dev pain",
  "test success",
  "test pain",
];

const CURVE_HEADER = [
  "campaign",
  "iteration",
  "accepted",
  "generations",
  "evaluations",
  "cost (USD)",
  "iteration dev pain",
  "incumbent dev pain",
  "incumbent success",
];

const CELL_HEADER = ["policy", "city", "load", "runs", "success", "pain (complete only)", "95% CI"];

const PAIRED_HEADER = [
  "policy",
  "city",
  "load",
  "pairs",
  "both complete",
  "mean diff",
  "95% CI",
  "improvement %",
  "wins",
];

const GENERALIZATION_HEADER = [
  "campaign",
  "mode",
  "group",
  "runs",
  "success",
  "pain (complete only)",
];

const generatorNote = (analysis: Paper2Analysis): string =>
  `Suite ${analysis.benchmarkVersion}. Generator: ${analysis.generator.provider} / ${analysis.generator.modelId}. ` +
  (analysis.generator.provider === "sample"
    ? "**The sample generator is an offline stand-in, not a model; these numbers exercise the pipeline only.**"
    : "");

const headSections = (analysis: Paper2Analysis): string[] => [
  ...section(
    "Modes at equal budget",
    "Development pain is the incumbent's conditional mean at the end of the campaign; test pain is the selected program's, over complete runs only.",
    table(MODE_HEADER, modeRows(analysis.modes)),
  ),
  ...section(
    "Improvement curves",
    "One row per iteration: cumulative spend against the best accepted development pain so far.",
    table(CURVE_HEADER, curveRows(analysis.curves)),
  ),
  ...section(
    "Test split: programs and references",
    "Pain is over complete runs only; read it with the success rate.",
    table(CELL_HEADER, cellRows(analysis.testCells)),
  ),
];

const amortizationSection = (analysis: Paper2Analysis): string[] => {
  const ks = kColumns(analysis);
  return section(
    "Cost per run when one artifact serves K runs (G/K + R)",
    "Generated programs pay generation once and no API cost per run (CPU shown separately). References use the stated preparation cost plus their measured per-run API cost.",
    table(
      ["policy", "kind", "G (USD)", "R (USD)", "CPU/run (ms)", ...ks.map((k) => `K=${k}`)],
      amortizationRows(analysis.amortization, ks),
    ),
  );
};

const tailSections = (analysis: Paper2Analysis): string[] => [
  ...section(
    `Paired against ${analysis.referencePolicyId ?? "(no reference)"} on the test split`,
    "Diff is reference pain minus policy pain on the same scenario; positive favours the policy.",
    table(PAIRED_HEADER, pairedRows(analysis.testPaired)),
  ),
  ...section(
    "Generalisation: seen versus held-out cities",
    "Held-out cities were excluded from development and validation.",
    table(GENERALIZATION_HEADER, generalizationRows(analysis.generalization)),
  ),
  ...amortizationSection(analysis),
];

/** Markdown artifact for the second paper. Every table is derived from stored records. */
export const paper2Markdown = (analysis: Paper2Analysis): string =>
  [
    `# Second-paper analysis: ${analysis.experimentId}`,
    "",
    generatorNote(analysis),
    "",
    ...headSections(analysis),
    ...tailSections(analysis),
  ].join("\n");
