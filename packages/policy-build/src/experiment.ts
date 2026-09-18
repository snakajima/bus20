import { paper2Markdown } from "@bus20/analysis/campaign-report";
import {
  analyzeExperiment,
  type CampaignRecord,
  type ExperimentInputs,
  type Paper2Analysis,
} from "@bus20/analysis/campaigns";
import { digestDocument } from "@bus20/contracts/digest";
import {
  type Budget,
  type CampaignMode,
  type ExperimentCampaign,
  type ExperimentIndex,
  experimentIndexSchema,
  type ExperimentReference,
  type ProgramEvaluation,
} from "@bus20/contracts/policy-artifact";
import { fail, type Issue, ok, type Result } from "@bus20/contracts/result";
import { suiteIndexSchema } from "@bus20/contracts/suite-index";
import { EXPERIMENT_SCHEMA_VERSION } from "@bus20/contracts/versions";
import { type LoadedSuite } from "@bus20/datasets/files";
import { readJsonFile, writeJsonAtomic, writeTextAtomic } from "@bus20/runner/files";
import { type Logger } from "@bus20/runner/logging";
import { type ManagedPolicy } from "@bus20/runner/run-scenario";
import { runSuite, SUITE_INDEX_FILE } from "@bus20/runner/suite";
import path from "node:path";
import {
  evaluationPath,
  readCampaign,
  readEvaluation,
  readProgram,
  runsDir,
  writeEvaluation,
} from "./artifacts.js";
import { runCampaign } from "./campaign.js";
import { evaluateProgram } from "./evaluate.js";
import { type ProgramGenerator } from "./generator.js";

export const EXPERIMENT_FILE = "experiment.json";
export const ANALYSIS_JSON = "paper2-analysis.json";
export const ANALYSIS_MARKDOWN = "paper2-analysis.md";

export interface ExperimentRequest {
  readonly id: string;
  readonly suite: LoadedSuite;
  readonly modes: readonly CampaignMode[];
  readonly seeds: readonly number[];
  readonly budget: Budget;
  readonly devSplit: string;
  readonly validationSplit: string;
  readonly testSplit: string;
  readonly heldOutCities: readonly string[];
  readonly generator: {
    readonly provider: string;
    readonly modelId: string;
    readonly create: (seed: number) => ProgramGenerator;
  };
  /** Reference policies to run on the test split (A, C, fixture), keyed by id. */
  readonly references: Readonly<Record<string, () => ManagedPolicy>>;
  readonly runsPerArtifact: readonly number[];
  readonly onlinePreparationCostUsd: Readonly<Record<string, number>>;
  readonly outDir: string;
  readonly logger: Logger;
}

const campaignDir = (mode: CampaignMode, seed: number): string =>
  path.join("campaigns", `${mode}-${seed}`);

const campaignRequest = (
  request: ExperimentRequest,
  mode: CampaignMode,
  seed: number,
  outDir: string,
) => ({
  id: `${mode}-${seed}`,
  mode,
  suite: request.suite,
  devSplit: request.devSplit,
  validationSplit: request.validationSplit,
  seed,
  budget: request.budget,
  generator: request.generator.create(seed),
  outDir,
  excludeCities: request.heldOutCities,
  logger: request.logger,
});

const runOneCampaign = async (
  request: ExperimentRequest,
  mode: CampaignMode,
  seed: number,
): Promise<ExperimentCampaign> => {
  const dir = campaignDir(mode, seed);
  const outDir = path.join(request.outDir, dir);
  const campaign = await runCampaign(campaignRequest(request, mode, seed, outDir));
  const testPath =
    campaign.selectedProgramId === null
      ? null
      : await testSelected(request, outDir, campaign.selectedProgramId, campaign.seed);
  const testEvaluationPath = testPath === null ? null : path.relative(request.outDir, testPath);
  const { id: campaignId, selectedProgramId } = campaign;
  return { mode, seed, dir, campaignId, selectedProgramId, testEvaluationPath };
};

/** Test evaluation is written beside the campaign and never read by it. */
const testSelected = async (
  request: ExperimentRequest,
  campaignOutDir: string,
  programId: string,
  seed: number,
): Promise<string> => {
  const program = await readProgram(campaignOutDir, programId);
  if (!program.ok) {
    throw new Error(`selected program ${programId} is missing`);
  }
  const split = request.testSplit;
  const evaluation = await evaluateProgram({
    ...{ suite: request.suite, logger: request.logger, campaignSeed: seed, split },
    program: program.value,
    outDir: runsDir(campaignOutDir, programId, split),
  });
  await writeEvaluation(campaignOutDir, evaluation);
  return evaluationPath(campaignOutDir, programId, split);
};

const runReference = async (
  request: ExperimentRequest,
  policyId: string,
  factory: () => ManagedPolicy,
) => {
  const dir = path.join("references", policyId.replace(/[^A-Za-z0-9._-]/g, "_"));
  await runSuite({
    suite: request.suite,
    policies: [factory],
    splits: [request.testSplit],
    repetitions: 1,
    outDir: path.join(request.outDir, dir),
    logger: request.logger,
  });
  return { policyId, suiteIndexPath: path.join(dir, SUITE_INDEX_FILE) };
};

/**
 * Runs every campaign (mode × seed), evaluates each selected program on the
 * test split, runs the reference policies on the same split, and writes the
 * experiment index. Campaigns resume from their directories.
 */
const runAllCampaigns = async (request: ExperimentRequest): Promise<ExperimentCampaign[]> => {
  const campaigns: ExperimentCampaign[] = [];
  for (const mode of request.modes) {
    for (const seed of request.seeds) {
      campaigns.push(await runOneCampaign(request, mode, seed));
    }
  }
  return campaigns;
};

const runAllReferences = async (request: ExperimentRequest): Promise<ExperimentReference[]> => {
  const references: ExperimentReference[] = [];
  for (const [policyId, factory] of Object.entries(request.references)) {
    references.push(await runReference(request, policyId, factory));
  }
  return references;
};

const indexOf = (
  request: ExperimentRequest,
  campaigns: ExperimentCampaign[],
  references: ExperimentReference[],
): ExperimentIndex => ({
  schemaVersion: EXPERIMENT_SCHEMA_VERSION,
  id: request.id,
  benchmarkVersion: request.suite.manifest.benchmarkVersion,
  manifestDigest: digestDocument(request.suite.manifest),
  generator: { provider: request.generator.provider, modelId: request.generator.modelId },
  testSplit: request.testSplit,
  heldOutCities: [...request.heldOutCities],
  budget: request.budget,
  campaigns,
  references,
  amortization: {
    runsPerArtifact: [...request.runsPerArtifact],
    onlinePreparationCostUsd: { ...request.onlinePreparationCostUsd },
  },
});

export const runExperiment = async (request: ExperimentRequest): Promise<ExperimentIndex> => {
  const campaigns = await runAllCampaigns(request);
  const references = await runAllReferences(request);
  const index = indexOf(request, campaigns, references);
  await writeJsonAtomic(path.join(request.outDir, EXPERIMENT_FILE), index);
  return index;
};

const loadCampaignRecord = async (
  root: string,
  entry: ExperimentCampaign,
  testSplit: string,
): Promise<Result<CampaignRecord>> => {
  const campaign = await readCampaign(path.join(root, entry.dir));
  if (!campaign.ok) {
    return campaign;
  }
  const testEvaluation = await loadTestEvaluation(path.join(root, entry.dir), entry, testSplit);
  return testEvaluation.ok
    ? ok({ campaign: campaign.value, testEvaluation: testEvaluation.value })
    : testEvaluation;
};

const loadTestEvaluation = async (
  dir: string,
  entry: ExperimentCampaign,
  testSplit: string,
): Promise<Result<ProgramEvaluation | null>> =>
  entry.selectedProgramId === null
    ? ok(null)
    : readEvaluation(dir, entry.selectedProgramId, testSplit);

/** All values, or every issue from the failed ones. */
const collect = <T>(results: readonly Result<T>[]): Result<T[]> => {
  const issues: Issue[] = results.flatMap((result) => (result.ok ? [] : result.issues));
  return issues.length > 0
    ? fail(issues)
    : ok(results.flatMap((result) => (result.ok ? [result.value] : [])));
};

/** Loads an experiment directory and produces the analysis JSON and Markdown. */
export const reportExperiment = async (
  root: string,
  seed: number,
): Promise<Result<Paper2Analysis>> => {
  const index = await readJsonFile(path.join(root, EXPERIMENT_FILE), experimentIndexSchema);
  if (!index.ok) {
    return index;
  }
  const inputs = await loadInputs(root, index.value);
  if (!inputs.ok) {
    return inputs;
  }
  const analysis = analyzeExperiment(inputs.value, seed);
  await writeJsonAtomic(path.join(root, ANALYSIS_JSON), analysis);
  await writeTextAtomic(path.join(root, ANALYSIS_MARKDOWN), paper2Markdown(analysis));
  return ok(analysis);
};

const loadReferences = async (root: string, index: ExperimentIndex) =>
  collect(
    await Promise.all(
      index.references.map((reference) =>
        readJsonFile(path.join(root, reference.suiteIndexPath), suiteIndexSchema),
      ),
    ),
  );

const loadInputs = async (
  root: string,
  index: ExperimentIndex,
): Promise<Result<ExperimentInputs>> => {
  const campaigns = collect(
    await Promise.all(
      index.campaigns.map((entry) => loadCampaignRecord(root, entry, index.testSplit)),
    ),
  );
  const references = await loadReferences(root, index);
  if (!campaigns.ok || !references.ok) {
    return fail([
      ...(campaigns.ok ? [] : campaigns.issues),
      ...(references.ok ? [] : references.issues),
    ]);
  }
  return ok({ index, campaigns: campaigns.value, references: references.value });
};
