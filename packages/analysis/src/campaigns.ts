import {
  type Campaign,
  type CampaignMode,
  type EvaluationSummary,
  type ExperimentIndex,
  type ProgramEvaluation,
} from "@bus20/contracts/policy-artifact";
import { type SuiteIndex, type SuiteRun } from "@bus20/contracts/suite-index";
import { SUITE_INDEX_SCHEMA_VERSION } from "@bus20/contracts/versions";
import {
  type CellSummary,
  type PairedSummary,
  summarizeCells,
  summarizePaired,
} from "./aggregate.js";
import { mean } from "./statistics.js";

/** One campaign with what the experiment produced for it. */
export interface CampaignRecord {
  readonly campaign: Campaign;
  readonly testEvaluation: ProgramEvaluation | null;
}

export interface ExperimentInputs {
  readonly index: ExperimentIndex;
  readonly campaigns: readonly CampaignRecord[];
  readonly references: readonly SuiteIndex[];
}

/** Improvement curve point: cumulative spend against the best accepted dev pain so far. */
export interface CurvePoint {
  readonly iteration: number;
  readonly accepted: boolean;
  readonly generations: number;
  readonly evaluations: number;
  readonly costUsd: number;
  readonly iterationDevPain: number | null;
  readonly incumbentDevPain: number | null;
  readonly incumbentSuccessRate: number | null;
}

export interface CampaignCurve {
  readonly campaignId: string;
  readonly mode: CampaignMode;
  readonly seed: number;
  readonly points: readonly CurvePoint[];
}

export interface ModeSummary {
  readonly mode: CampaignMode;
  readonly campaigns: number;
  readonly selected: number;
  readonly meanGenerations: number;
  readonly meanEvaluations: number;
  readonly meanCostUsd: number;
  readonly meanProgramCpuMs: number;
  readonly meanIncumbentDevPain: number | null;
  readonly meanTestSuccessRate: number | null;
  readonly meanTestConditionalPain: number | null;
}

export interface GeneralizationRow {
  readonly campaignId: string;
  readonly mode: CampaignMode;
  readonly seed: number;
  readonly group: "seen" | "held-out";
  readonly runs: number;
  readonly successRate: number;
  readonly conditionalMeanPain: number | null;
}

export interface AmortizationRow {
  readonly policyId: string;
  readonly kind: "generated-program" | "reference";
  readonly preparationCostUsd: number;
  readonly perRunCostUsd: number;
  readonly perRunProgramCpuMs: number;
  readonly costPerRunByK: Readonly<Record<string, number>>;
}

export interface Paper2Analysis {
  readonly experimentId: string;
  readonly benchmarkVersion: string;
  readonly generator: ExperimentIndex["generator"];
  readonly curves: readonly CampaignCurve[];
  readonly modes: readonly ModeSummary[];
  readonly testCells: readonly CellSummary[];
  readonly testPaired: readonly PairedSummary[];
  readonly referencePolicyId: string | null;
  readonly generalization: readonly GeneralizationRow[];
  readonly amortization: readonly AmortizationRow[];
}

interface Running {
  readonly generations: number;
  readonly evaluations: number;
  readonly costUsd: number;
  readonly incumbent: EvaluationSummary | undefined;
}

const advance = (running: Running, item: Campaign["iterations"][number]): Running => ({
  generations: running.generations + 1,
  evaluations: running.evaluations + (item.devSummary.runs > 0 ? 1 : 0),
  costUsd: running.costUsd + item.generationCostUsd,
  incumbent: item.accepted ? item.devSummary : running.incumbent,
});

const curveOf = (campaign: Campaign): CampaignCurve => {
  let running: Running = { generations: 0, evaluations: 0, costUsd: 0, incumbent: undefined };
  const points = campaign.iterations.map((item): CurvePoint => {
    running = advance(running, item);
    return {
      iteration: item.index,
      accepted: item.accepted,
      generations: running.generations,
      evaluations: running.evaluations,
      costUsd: running.costUsd,
      iterationDevPain: item.devSummary.conditionalMeanPain,
      incumbentDevPain: running.incumbent?.conditionalMeanPain ?? null,
      incumbentSuccessRate: running.incumbent?.successRate ?? null,
    };
  });
  return { campaignId: campaign.id, mode: campaign.mode, seed: campaign.seed, points };
};

const meanOrNull = (values: readonly (number | null)[]): number | null => {
  const present = values.flatMap((value) => (value === null ? [] : [value]));
  return present.length === 0 ? null : mean(present);
};

const lastIncumbentPain = (campaign: Campaign): number | null =>
  [...campaign.iterations].reverse().find((item) => item.accepted)?.devSummary
    .conditionalMeanPain ?? null;

const summarizeMode = (mode: CampaignMode, records: readonly CampaignRecord[]): ModeSummary => ({
  mode,
  campaigns: records.length,
  selected: records.filter((record) => record.campaign.selectedProgramId !== null).length,
  meanGenerations: mean(records.map((record) => record.campaign.spent.generations)),
  meanEvaluations: mean(records.map((record) => record.campaign.spent.evaluations)),
  meanCostUsd: mean(records.map((record) => record.campaign.spent.costUsd)),
  meanProgramCpuMs: mean(records.map((record) => record.campaign.spent.programCpuMs)),
  meanIncumbentDevPain: meanOrNull(records.map((record) => lastIncumbentPain(record.campaign))),
  meanTestSuccessRate: meanOrNull(
    records.map((record) => record.testEvaluation?.summary.successRate ?? null),
  ),
  meanTestConditionalPain: meanOrNull(
    records.map((record) => record.testEvaluation?.summary.conditionalMeanPain ?? null),
  ),
});

const modesOf = (records: readonly CampaignRecord[]): ModeSummary[] => {
  const modes = [...new Set(records.map((record) => record.campaign.mode))];
  return modes.map((mode) =>
    summarizeMode(
      mode,
      records.filter((record) => record.campaign.mode === mode),
    ),
  );
};

const programRuns = (record: CampaignRecord): SuiteRun[] =>
  (record.testEvaluation?.runs ?? []).map((run) => ({
    ...run,
    policy: { ...run.policy, id: `${record.campaign.mode}#${record.campaign.seed}` },
  }));

/** Programs and references on the same test scenarios, as one suite index. */
const testIndex = (inputs: ExperimentInputs): SuiteIndex => ({
  schemaVersion: SUITE_INDEX_SCHEMA_VERSION,
  benchmarkVersion: inputs.index.benchmarkVersion,
  manifestDigest: inputs.index.manifestDigest,
  splits: [inputs.index.testSplit],
  repetitions: 1,
  runs: [
    ...inputs.references.flatMap((reference) => reference.runs),
    ...inputs.campaigns.flatMap(programRuns),
  ],
});

const summarizeGroup = (
  runs: readonly SuiteRun[],
): Pick<GeneralizationRow, "runs" | "successRate" | "conditionalMeanPain"> => {
  const complete = runs.filter((run) => run.status === "complete");
  return {
    runs: runs.length,
    successRate: runs.length === 0 ? 0 : complete.length / runs.length,
    conditionalMeanPain: meanOrNull(complete.map((run) => run.pain)),
  };
};

const generalizationOf = (inputs: ExperimentInputs): GeneralizationRow[] =>
  inputs.campaigns.flatMap((record) => {
    const runs = record.testEvaluation?.runs ?? [];
    const heldOut = new Set(inputs.index.heldOutCities);
    const groups: ["seen" | "held-out", SuiteRun[]][] = [
      ["seen", runs.filter((run) => !heldOut.has(run.scenario.city))],
      ["held-out", runs.filter((run) => heldOut.has(run.scenario.city))],
    ];
    return groups
      .filter(([, group]) => group.length > 0)
      .map(([group, groupRuns]) => ({
        campaignId: record.campaign.id,
        mode: record.campaign.mode,
        seed: record.campaign.seed,
        group,
        ...summarizeGroup(groupRuns),
      }));
  });

const amortize = (
  preparation: number,
  perRun: number,
  ks: readonly number[],
): Record<string, number> =>
  Object.fromEntries(ks.map((k) => [String(k), preparation / k + perRun]));

const perRun = (runs: readonly SuiteRun[], key: "costUsd" | "programCpuMs"): number =>
  runs.length === 0
    ? 0
    : mean(runs.map((run) => (key === "costUsd" ? (run.costUsd ?? 0) : run.programCpuMs)));

/**
 * Cost per run when one artifact is reused K times: G/K + R. Generated
 * programs pay generation (G) once and no API cost per run; online policies
 * pay preparation (stated by the experimenter) plus API cost per run.
 */
const programAmortization = (record: CampaignRecord, ks: readonly number[]): AmortizationRow => {
  const runs = record.testEvaluation?.runs ?? [];
  const preparation = record.campaign.spent.costUsd;
  return {
    policyId: `${record.campaign.mode}#${record.campaign.seed}`,
    kind: "generated-program",
    preparationCostUsd: preparation,
    perRunCostUsd: 0,
    perRunProgramCpuMs: perRun(runs, "programCpuMs"),
    costPerRunByK: amortize(preparation, 0, ks),
  };
};

const referenceAmortization = (
  inputs: ExperimentInputs,
  reference: SuiteIndex,
  ks: readonly number[],
): AmortizationRow[] => {
  const [first] = reference.runs;
  if (first === undefined) {
    return [];
  }
  const preparation = inputs.index.amortization.onlinePreparationCostUsd[first.policy.id] ?? 0;
  const run = perRun(reference.runs, "costUsd");
  return [amortizationRow(first.policy.id, "reference", preparation, run, 0, ks)];
};

const amortizationRow = (
  policyId: string,
  kind: AmortizationRow["kind"],
  preparation: number,
  run: number,
  cpu: number,
  ks: readonly number[],
): AmortizationRow => ({
  policyId,
  kind,
  preparationCostUsd: preparation,
  perRunCostUsd: run,
  perRunProgramCpuMs: cpu,
  costPerRunByK: amortize(preparation, run, ks),
});

const amortizationOf = (inputs: ExperimentInputs): AmortizationRow[] => {
  const ks = inputs.index.amortization.runsPerArtifact;
  return [
    ...inputs.campaigns.map((record) => programAmortization(record, ks)),
    ...inputs.references.flatMap((reference) => referenceAmortization(inputs, reference, ks)),
  ];
};

const referenceId = (inputs: ExperimentInputs): string | null =>
  inputs.references.find((reference) => reference.runs[0]?.policy.kind === "swift-reference")
    ?.runs[0]?.policy.id ??
  inputs.references[0]?.runs[0]?.policy.id ??
  null;

/** Pure second-paper analysis. All statistics come from stored artifacts. */
export const analyzeExperiment = (inputs: ExperimentInputs, seed: number): Paper2Analysis => {
  const index = testIndex(inputs);
  const reference = referenceId(inputs);
  return {
    experimentId: inputs.index.id,
    benchmarkVersion: inputs.index.benchmarkVersion,
    generator: inputs.index.generator,
    curves: inputs.campaigns.map((record) => curveOf(record.campaign)),
    modes: modesOf(inputs.campaigns),
    testCells: summarizeCells(index, seed),
    testPaired: reference === null ? [] : summarizePaired(index, reference, seed),
    referencePolicyId: reference,
    generalization: generalizationOf(inputs),
    amortization: amortizationOf(inputs),
  };
};
