import { experimentIndexSchema } from "@bus20/contracts/policy-artifact";
import { type LoadedSuite } from "@bus20/datasets/files";
import { createFixturePolicy } from "@bus20/simulator/fixture-policy";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { readCampaign } from "../src/artifacts.js";
import { runCampaign } from "../src/campaign.js";
import {
  ANALYSIS_MARKDOWN,
  EXPERIMENT_FILE,
  type ExperimentRequest,
  reportExperiment,
  runExperiment,
} from "../src/experiment.js";
import {
  createSampleGenerator,
  SAMPLE_MODEL_ID,
  SAMPLE_PROVIDER,
} from "../src/sample-generator.js";
import { SAMPLE_LADDER } from "../src/sample-programs.js";
import { logger, SAMPLE_SOURCE, scriptedGenerator, smallSuite, tempDir } from "./helpers.js";

const budget = { maxGenerations: 3, maxEvaluations: 12, maxCostUsd: null };

const request = (suite: LoadedSuite, outDir: string): ExperimentRequest => ({
  id: "exp",
  suite,
  modes: ["B0", "B-self"],
  seeds: [1],
  budget,
  devSplit: "dev",
  validationSplit: "validation",
  testSplit: "test",
  heldOutCities: [],
  generator: { provider: SAMPLE_PROVIDER, modelId: SAMPLE_MODEL_ID, create: createSampleGenerator },
  references: { fixture: () => ({ policy: createFixturePolicy(), close: () => undefined }) },
  runsPerArtifact: [1, 10],
  onlinePreparationCostUsd: { fixture: 0 },
  outDir,
  logger,
});

test("an offline experiment produces campaigns, test evaluations, references, and the report", async () => {
  const suite = await smallSuite();
  const outDir = tempDir();
  const index = await runExperiment(request(suite, outDir));
  const stored: unknown = JSON.parse(readFileSync(path.join(outDir, EXPERIMENT_FILE), "utf8"));
  assert.equal(experimentIndexSchema.safeParse(stored).success, true);
  assert.equal(index.campaigns.length, 2);
  assert.ok(index.campaigns.every((campaign) => campaign.testEvaluationPath !== null));
  const analysis = await reportExperiment(outDir, 1);
  assert.ok(analysis.ok);
  assert.deepEqual(
    analysis.value.modes.map((mode) => mode.mode),
    ["B0", "B-self"],
  );
  assert.equal(analysis.value.referencePolicyId, "fixture-append-earliest-pickup");
  assert.ok(analysis.value.amortization.some((row) => row.kind === "reference"));
  const markdown = readFileSync(path.join(outDir, ANALYSIS_MARKDOWN), "utf8");
  assert.match(markdown, /offline stand-in, not a model/);
  assert.match(markdown, /## Improvement curves/);
  assert.match(markdown, /K=10/);
  // Rerunning reuses every finished run and campaign; nothing is regenerated.
  const again = await runExperiment(request(suite, outDir));
  assert.deepEqual(again.campaigns, index.campaigns);
});

test("held-out cities are excluded from development and validation but kept in the test split", async () => {
  const suite = await smallSuite();
  const outDir = tempDir();
  const campaign = await runCampaign({
    id: "held",
    mode: "B0",
    suite,
    devSplit: "dev",
    validationSplit: "validation",
    seed: 3,
    budget,
    generator: scriptedGenerator([SAMPLE_SOURCE]),
    outDir,
    excludeCities: ["a"],
    logger,
  });
  assert.deepEqual(campaign.excludeCities, ["a"]);
  // The only city is held out, so development evaluations see no scenarios and nothing can be selected.
  assert.equal(campaign.iterations[0]?.devSummary.runs, 0);
});

test("a campaign resumes from its directory and continues the lineage", async () => {
  const suite = await smallSuite();
  const outDir = tempDir();
  const first = await runCampaign({
    id: "resume",
    mode: "B-self",
    suite,
    devSplit: "dev",
    validationSplit: "validation",
    seed: 4,
    budget: { maxGenerations: 2, maxEvaluations: 1, maxCostUsd: null },
    generator: scriptedGenerator([SAMPLE_LADDER[0], SAMPLE_LADDER[2]]),
    outDir,
    logger,
  });
  assert.equal(first.frozen, true);
  const stored = await readCampaign(outDir);
  assert.ok(stored.ok);
  assert.deepEqual(stored.value, first);
  const resumed = await runCampaign({
    id: "resume",
    mode: "B-self",
    suite,
    devSplit: "dev",
    validationSplit: "validation",
    seed: 4,
    budget: { maxGenerations: 2, maxEvaluations: 1, maxCostUsd: null },
    generator: scriptedGenerator([]),
    outDir,
    logger,
  });
  assert.deepEqual(resumed, first, "a frozen campaign is returned untouched");
  await assert.rejects(
    runCampaign({
      id: "other",
      mode: "B0",
      suite,
      devSplit: "dev",
      validationSplit: "validation",
      seed: 4,
      budget,
      generator: scriptedGenerator([]),
      outDir,
      logger,
    }),
    /different campaign/,
  );
  assert.ok(existsSync(path.join(outDir, "campaign.json")));
});
