import {
  campaignSchema,
  policyProgramSchema,
  programEvaluationSchema,
} from "@bus20/contracts/policy-artifact";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { evaluationPath, programPath, readCampaign } from "../src/artifacts.js";
import { runCampaign } from "../src/campaign.js";
import { evaluateProgram } from "../src/evaluate.js";
import { compareForSelection, isImprovement } from "../src/selection.js";
import {
  BROKEN_SOURCE,
  FIRST_CANDIDATE_SOURCE,
  LAST_CANDIDATE_SOURCE,
  logger,
  SAMPLE_SOURCE,
  scriptedGenerator,
  smallSuite,
  tempDir,
} from "./helpers.js";

const budget = { maxGenerations: 4, maxEvaluations: 20, maxCostUsd: null };

test("B-self keeps every program, accepts only improvements, and selects on validation", async () => {
  const suite = await smallSuite();
  const generator = scriptedGenerator([
    FIRST_CANDIDATE_SOURCE,
    SAMPLE_SOURCE,
    BROKEN_SOURCE,
    LAST_CANDIDATE_SOURCE,
  ]);
  const outDir = tempDir();
  const campaign = await runCampaign({
    id: "self",
    mode: "B-self",
    suite,
    devSplit: "dev",
    validationSplit: "validation",
    seed: 5,
    budget,
    generator,
    outDir,
    logger,
  });
  assert.equal(campaign.frozen, true);
  assert.deepEqual(
    campaign.iterations.map((item) => item.accepted),
    [true, true, false, false],
  );
  assert.match(campaign.iterations[2]?.reason ?? "", /compile error/);
  assert.match(campaign.iterations[3]?.reason ?? "", /rejected/);
  assert.equal(campaign.selectedProgramId, "self-v001");
  assert.equal(campaign.spent.generations, 4);
  // dev evaluations for v0, v1, v3 (v2 never compiled) plus validation for the two accepted.
  assert.equal(campaign.spent.evaluations, 5);
  assert.ok(Math.abs(campaign.spent.costUsd - 0.04) < 1e-12);
  assert.equal(campaign.stopReason, "attempt limit reached");
  // Revisions receive the incumbent's source and aggregate feedback, never test data.
  const revision = generator.inputs[1];
  assert.ok(revision !== undefined);
  assert.equal(revision.kind, "revision");
  assert.equal(revision.previousSource, FIRST_CANDIDATE_SOURCE);
  assert.match(revision.feedback ?? "", /Development split "dev"/);
  assert.ok(!(revision.feedback ?? "").includes("test"));
  assert.equal(
    generator.inputs[3]?.previousSource,
    SAMPLE_SOURCE,
    "lineage continues from the accepted program",
  );
  // Artifacts: every program, every evaluation, the frozen record.
  for (const item of campaign.iterations) {
    const program = policyProgramSchema.safeParse(
      JSON.parse(readFileSync(programPath(outDir, item.programId), "utf8")),
    );
    assert.ok(program.success);
  }
  const validation = programEvaluationSchema.safeParse(
    JSON.parse(readFileSync(evaluationPath(outDir, "self-v001", "validation"), "utf8")),
  );
  assert.ok(validation.success);
  assert.equal(existsSync(evaluationPath(outDir, "self-v000", "test")), false);
  const stored = await readCampaign(outDir);
  assert.ok(stored.ok);
  assert.deepEqual(stored.value, campaign);
  assert.equal(campaignSchema.safeParse(campaign).success, true);
});

test("B-restart treats every compiling program as a candidate and never sends feedback", async () => {
  const suite = await smallSuite();
  const generator = scriptedGenerator([
    LAST_CANDIDATE_SOURCE,
    SAMPLE_SOURCE,
    FIRST_CANDIDATE_SOURCE,
  ]);
  const campaign = await runCampaign({
    id: "restart",
    mode: "B-restart",
    suite,
    devSplit: "dev",
    validationSplit: "validation",
    seed: 5,
    budget: { ...budget, maxGenerations: 3 },
    generator,
    outDir: tempDir(),
    logger,
  });
  assert.ok(generator.inputs.every((input) => input.kind === "initial"));
  assert.deepEqual(
    generator.inputs.map((input) => input.attempt),
    [0, 1, 2],
  );
  assert.deepEqual(
    campaign.iterations.map((item) => item.accepted),
    [true, true, true],
  );
  assert.equal(campaign.selectedProgramId, "restart-v001");
  assert.equal(campaign.spent.evaluations, 6);
});

test("B0 generates once; budgets stop a campaign with a recorded reason", async () => {
  const suite = await smallSuite();
  const single = await runCampaign({
    id: "b0",
    mode: "B0",
    suite,
    devSplit: "dev",
    validationSplit: "validation",
    seed: 5,
    budget,
    generator: scriptedGenerator([SAMPLE_SOURCE, SAMPLE_SOURCE]),
    outDir: tempDir(),
    logger,
  });
  assert.equal(single.spent.generations, 1);
  assert.equal(single.selectedProgramId, "b0-v000");
  const capped = await runCampaign({
    id: "capped",
    mode: "B-self",
    suite,
    devSplit: "dev",
    validationSplit: "validation",
    seed: 5,
    budget: { maxGenerations: 4, maxEvaluations: 20, maxCostUsd: 0.015 },
    generator: scriptedGenerator([SAMPLE_SOURCE, SAMPLE_SOURCE, SAMPLE_SOURCE]),
    outDir: tempDir(),
    logger,
  });
  assert.equal(capped.spent.generations, 2);
  assert.equal(capped.stopReason, "cost budget exhausted");
});

test("selection rules: success first, then pain; ties are not improvements", () => {
  const base = {
    runs: 2,
    completeRuns: 2,
    successRate: 1,
    conditionalMeanPain: 10,
    programCpuMs: 0,
    failureReasons: {},
  };
  assert.equal(isImprovement({ ...base, conditionalMeanPain: 9 }, base), true);
  assert.equal(isImprovement({ ...base, conditionalMeanPain: 10 }, base), false);
  assert.equal(isImprovement({ ...base, successRate: 0.5, conditionalMeanPain: 1 }, base), false);
  assert.equal(
    isImprovement(
      { ...base, successRate: 1 },
      { ...base, successRate: 0.5, conditionalMeanPain: 1 },
    ),
    true,
  );
  const ordered = [
    { ...base, conditionalMeanPain: 5 },
    { ...base, successRate: 0.5, conditionalMeanPain: 1 },
    { ...base, conditionalMeanPain: 3 },
  ].sort(compareForSelection);
  assert.deepEqual(
    ordered.map((item) => item.conditionalMeanPain),
    [3, 5, 1],
  );
});

test("a frozen program evaluates deterministically on the test split", async () => {
  const suite = await smallSuite();
  const outDir = tempDir();
  const campaign = await runCampaign({
    id: "det",
    mode: "B0",
    suite,
    devSplit: "dev",
    validationSplit: "validation",
    seed: 9,
    budget,
    generator: scriptedGenerator([SAMPLE_SOURCE]),
    outDir,
    logger,
  });
  const program = policyProgramSchema.parse(
    JSON.parse(readFileSync(programPath(outDir, campaign.selectedProgramId ?? ""), "utf8")),
  );
  const first = await evaluateProgram({
    program,
    suite,
    split: "test",
    outDir: path.join(outDir, "t1"),
    campaignSeed: 9,
    logger,
  });
  const second = await evaluateProgram({
    program,
    suite,
    split: "test",
    outDir: path.join(outDir, "t2"),
    campaignSeed: 9,
    logger,
  });
  // Rider outcomes are deterministic; CPU accounting is not and must not affect them.
  const withoutCpu = (summary: typeof first.summary) => ({ ...summary, programCpuMs: 0 });
  assert.deepEqual(withoutCpu(first.summary), withoutCpu(second.summary));
  assert.deepEqual(
    first.runs.map((run) => run.pain),
    second.runs.map((run) => run.pain),
  );
  assert.equal(first.runs.length, 1);
  assert.ok(first.summary.programCpuMs >= 0);
});
