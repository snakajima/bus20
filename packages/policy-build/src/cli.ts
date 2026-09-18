#!/usr/bin/env node
import {
  type Budget,
  type Campaign,
  CAMPAIGN_MODES,
  type CampaignMode,
  type ExperimentIndex,
  type PolicyProgram,
} from "@bus20/contracts/policy-artifact";
import { fail, formatIssues, issue, type Issue, ok, type Result } from "@bus20/contracts/result";
import { type LoadedSuite, loadSuite } from "@bus20/datasets/files";
import { createStderrLogger } from "@bus20/runner/logging";
import { parseArgs } from "node:util";
import { readCampaign, readProgram, runsDir, writeEvaluation } from "./artifacts.js";
import { type CampaignRequest, runCampaign } from "./campaign.js";
import { evaluateProgram } from "./evaluate.js";
import { createClaudeGenerator } from "./generator.js";
import { type ExperimentConfig, experimentConfigSchema } from "./experiment-config.js";
import { type ExperimentRequest, reportExperiment, runExperiment } from "./experiment.js";
import { createSampleGenerator, SAMPLE_MODEL_ID, SAMPLE_PROVIDER } from "./sample-generator.js";
import { parseJsonWithSchema } from "@bus20/contracts/json";
import { createPolicyById, type ManagedPolicy } from "@bus20/runner/run-scenario";
import { readFile } from "node:fs/promises";
import path from "node:path";

const USAGE = `usage:
  bus20-improve campaign --manifest <file> --mode B0|B-restart|B-self --out <dir>
                         [--generations N] [--evaluations N] [--budget-usd X] [--seed N]
                         [--dev-split dev] [--validation-split validation] [--model <id>]
  bus20-improve test --campaign <dir> --manifest <file> [--split test]
  bus20-improve experiment --config <file> --out <dir> [--seed N]
  bus20-improve report --experiment <dir> [--seed N]`;

const EXIT_OK = 0;
const EXIT_FAILED = 1;
const EXIT_USAGE = 2;
const DEFAULT_GENERATIONS = 4;
const DEFAULT_EVALUATIONS = 12;
const DEFAULT_SEED = 1;

const OPTIONS = {
  manifest: { type: "string" },
  mode: { type: "string" },
  out: { type: "string" },
  generations: { type: "string" },
  evaluations: { type: "string" },
  "budget-usd": { type: "string" },
  seed: { type: "string" },
  "dev-split": { type: "string", default: "dev" },
  "validation-split": { type: "string", default: "validation" },
  model: { type: "string" },
  campaign: { type: "string" },
  split: { type: "string", default: "test" },
  config: { type: "string" },
  experiment: { type: "string" },
} as const;

const usageError = (): number => {
  process.stderr.write(`${USAGE}\n`);
  return EXIT_USAGE;
};

const issuesError = (issues: readonly Issue[]): number => {
  process.stderr.write(`${formatIssues(issues)}\n`);
  return EXIT_FAILED;
};

const emit = (value: unknown): void => {
  process.stdout.write(`${JSON.stringify(value)}\n`);
};

const positive = (raw: string | undefined, fallback: number): number => {
  const value = Number(raw ?? fallback);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
};

const parseMode = (raw: string | undefined): CampaignMode | undefined =>
  CAMPAIGN_MODES.find((mode) => mode === raw);

type Values = ReturnType<
  typeof parseArgs<{ options: typeof OPTIONS; allowPositionals: true }>
>["values"];

const budgetOf = (values: Values): Budget => {
  const budgetUsd = values["budget-usd"];
  return {
    maxGenerations: positive(values.generations, DEFAULT_GENERATIONS),
    maxEvaluations: positive(values.evaluations, DEFAULT_EVALUATIONS),
    maxCostUsd: budgetUsd === undefined ? null : positive(budgetUsd, 0),
  };
};

const campaignRequest = (
  values: Values,
  mode: CampaignMode,
  suite: LoadedSuite,
  outDir: string,
): CampaignRequest => {
  const seed = positive(values.seed, DEFAULT_SEED);
  return {
    id: `${mode}-${seed}`,
    mode,
    suite,
    devSplit: values["dev-split"],
    validationSplit: values["validation-split"],
    seed,
    budget: budgetOf(values),
    generator: createClaudeGenerator(values.model === undefined ? {} : { modelId: values.model }),
    outDir,
    logger: createStderrLogger(),
  };
};

const campaignCommand = async (values: Values): Promise<number> => {
  const mode = parseMode(values.mode);
  if (values.manifest === undefined || values.out === undefined || mode === undefined) {
    return usageError();
  }
  const suite = await loadSuite(values.manifest);
  if (!suite.ok) {
    return issuesError(suite.issues);
  }
  const campaign = await runCampaign(campaignRequest(values, mode, suite.value, values.out));
  const { id, selectedProgramId, spent, stopReason } = campaign;
  emit({ campaignId: id, selectedProgramId, spent, stopReason });
  return selectedProgramId === null ? EXIT_FAILED : EXIT_OK;
};

interface FrozenSelection {
  readonly campaign: Campaign;
  readonly program: PolicyProgram;
  readonly suite: LoadedSuite;
}

const loadFrozen = async (
  campaignDir: string,
  manifestPath: string,
): Promise<Result<FrozenSelection>> => {
  const [campaign, suite] = await Promise.all([readCampaign(campaignDir), loadSuite(manifestPath)]);
  if (!campaign.ok || !suite.ok) {
    return fail([...(campaign.ok ? [] : campaign.issues), ...(suite.ok ? [] : suite.issues)]);
  }
  if (!campaign.value.frozen || campaign.value.selectedProgramId === null) {
    return fail([issue(campaignDir, "campaign is not frozen or selected no program")]);
  }
  const program = await readProgram(campaignDir, campaign.value.selectedProgramId);
  return program.ok
    ? ok({ campaign: campaign.value, program: program.value, suite: suite.value })
    : program;
};

/** Test evaluation of a frozen campaign's selected program. Never feeds back into the campaign. */
const testCommand = async (values: Values): Promise<number> => {
  if (values.campaign === undefined || values.manifest === undefined) {
    return usageError();
  }
  const frozen = await loadFrozen(values.campaign, values.manifest);
  if (!frozen.ok) {
    return issuesError(frozen.issues);
  }
  const evaluation = await evaluateFrozen(frozen.value, values.campaign, values.split);
  await writeEvaluation(values.campaign, evaluation);
  emit({ programId: evaluation.programId, split: values.split, summary: evaluation.summary });
  return EXIT_OK;
};

const evaluateFrozen = (frozen: FrozenSelection, campaignDir: string, split: string) =>
  evaluateProgram({
    program: frozen.program,
    suite: frozen.suite,
    split,
    outDir: runsDir(campaignDir, frozen.program.id, split),
    campaignSeed: frozen.campaign.seed,
    logger: createStderrLogger(),
  });

const generatorFor = (config: ExperimentConfig): ExperimentRequest["generator"] =>
  config.generator.provider === "sample"
    ? { provider: SAMPLE_PROVIDER, modelId: SAMPLE_MODEL_ID, create: createSampleGenerator }
    : {
        provider: "anthropic",
        modelId: config.generator.modelId,
        create: () =>
          createClaudeGenerator({
            modelId: config.generator.provider === "anthropic" ? config.generator.modelId : "",
            ...(config.generator.provider === "anthropic" && config.generator.effort !== undefined
              ? { effort: config.generator.effort }
              : {}),
          }),
      };

const referencesFor = (config: ExperimentConfig): Record<string, () => ManagedPolicy> => {
  const swiftCommand = config.swiftCli ?? process.env["BUS20_SWIFT_CLI"];
  const entries = config.references.flatMap((id): [string, () => ManagedPolicy][] => {
    const factory = () => {
      const managed = createPolicyById(
        id,
        swiftCommand === undefined || swiftCommand === "" ? {} : { swiftCommand },
      );
      if (managed === undefined) {
        throw new Error(`reference policy "${id}" is unavailable (set BUS20_SWIFT_CLI for swift)`);
      }
      return managed;
    };
    return [[id, factory]];
  });
  return Object.fromEntries(entries);
};

const loadExperimentConfig = async (
  configPath: string,
): Promise<Result<{ config: ExperimentConfig; suite: LoadedSuite }>> => {
  const config = parseJsonWithSchema(experimentConfigSchema, await readFile(configPath, "utf8"));
  if (!config.ok) {
    return config;
  }
  const suite = await loadSuite(path.resolve(path.dirname(configPath), config.value.manifest));
  return suite.ok ? ok({ config: config.value, suite: suite.value }) : suite;
};

const experimentCommand = async (values: Values): Promise<number> => {
  if (values.config === undefined || values.out === undefined) {
    return usageError();
  }
  const loaded = await loadExperimentConfig(values.config);
  if (!loaded.ok) {
    return issuesError(loaded.issues);
  }
  const index = await runExperiment(
    experimentRequest(loaded.value.config, loaded.value.suite, values.out),
  );
  const analysis = await reportExperiment(values.out, positive(values.seed, DEFAULT_SEED));
  return analysis.ok ? emitExperiment(index, values.out) : issuesError(analysis.issues);
};

const emitExperiment = (index: ExperimentIndex, outDir: string): number => {
  const { id, campaigns, references } = index;
  emit({ experimentId: id, campaigns: campaigns.length, references: references.length, outDir });
  return EXIT_OK;
};

const experimentRequest = (
  config: ExperimentConfig,
  suite: LoadedSuite,
  outDir: string,
): ExperimentRequest => ({
  ...splitsAndBudget(config),
  id: config.id,
  suite,
  modes: config.modes,
  seeds: config.seeds,
  generator: generatorFor(config),
  references: referencesFor(config),
  runsPerArtifact: config.runsPerArtifact,
  onlinePreparationCostUsd: config.onlinePreparationCostUsd,
  outDir,
  logger: createStderrLogger(),
});

const splitsAndBudget = (config: ExperimentConfig) => ({
  budget: config.budget,
  devSplit: config.devSplit,
  validationSplit: config.validationSplit,
  testSplit: config.testSplit,
  heldOutCities: config.heldOutCities,
});

const reportCommand = async (values: Values): Promise<number> => {
  if (values.experiment === undefined) {
    return usageError();
  }
  const analysis = await reportExperiment(values.experiment, positive(values.seed, DEFAULT_SEED));
  if (!analysis.ok) {
    return issuesError(analysis.issues);
  }
  emit({
    experimentId: analysis.value.experimentId,
    modes: analysis.value.modes.length,
    outDir: values.experiment,
  });
  return EXIT_OK;
};

const COMMANDS: Readonly<Record<string, (values: Values) => Promise<number>>> = {
  campaign: campaignCommand,
  test: testCommand,
  experiment: experimentCommand,
  report: reportCommand,
};

export const main = (argv: readonly string[]): Promise<number> => {
  const { values, positionals } = parseArgs({
    args: [...argv],
    options: OPTIONS,
    allowPositionals: true,
  });
  const command = COMMANDS[positionals[0] ?? ""];
  return command === undefined ? Promise.resolve(usageError()) : command(values);
};

main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`,
    );
    process.exitCode = EXIT_FAILED;
  },
);
