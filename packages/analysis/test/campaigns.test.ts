import {
  type Campaign,
  type ExperimentIndex,
  type ProgramEvaluation,
} from "@bus20/contracts/policy-artifact";
import { type SuiteIndex, type SuiteRun } from "@bus20/contracts/suite-index";
import assert from "node:assert/strict";
import { test } from "node:test";
import { paper2Markdown } from "../src/campaign-report.js";
import { analyzeExperiment } from "../src/campaigns.js";

const run = (
  policyId: string,
  kind: SuiteRun["policy"]["kind"],
  city: string,
  id: string,
  pain: number | null,
  costUsd: number | null,
): SuiteRun => ({
  policy: { id: policyId, kind },
  scenario: {
    id,
    path: `${id}.json`,
    digest: `sha256:${"0".repeat(64)}`,
    mapId: city,
    city,
    load: "low",
    pattern: "uniform",
    split: "test",
    seed: 1,
    requestCount: 5,
    vehicleCount: 1,
  },
  repetition: 0,
  dir: `${policyId}/${id}`,
  status: pain === null ? "failed" : "complete",
  pain,
  failureReason: pain === null ? "deadlineExceeded" : null,
  failureDetail: null,
  completedCount: 5,
  requestCount: 5,
  decisions: 5,
  latencyMedianMs: 1,
  latencyP95Ms: 2,
  inputTokens: 0,
  outputTokens: 0,
  costUsd,
  programCpuMs: kind === "generated-program" ? 10 : 0,
  replayMatches: true,
});

const summary = (pain: number | null, runs = 2) => ({
  runs,
  completeRuns: pain === null ? 0 : runs,
  successRate: pain === null ? 0 : 1,
  conditionalMeanPain: pain,
  programCpuMs: 20,
  failureReasons: {},
});

const campaign = (
  mode: Campaign["mode"],
  seed: number,
  pains: readonly (number | null)[],
  accepted: readonly boolean[],
): Campaign => ({
  schemaVersion: "bus20-campaign/1",
  id: `${mode}-${seed}`,
  mode,
  benchmarkVersion: "t/1",
  manifestDigest: `sha256:${"1".repeat(64)}`,
  devSplit: "dev",
  validationSplit: "validation",
  seed,
  excludeCities: ["b"],
  budget: { maxGenerations: 3, maxEvaluations: 9, maxCostUsd: null },
  spent: {
    generations: pains.length,
    evaluations: pains.length,
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0.3,
    programCpuMs: 20 * pains.length,
  },
  iterations: pains.map((pain, index) => ({
    index,
    programId: `${mode}-${seed}-v${index}`,
    generationCostUsd: 0.1,
    devSummary: summary(pain),
    accepted: accepted[index] ?? false,
    reason: "",
  })),
  selectedProgramId: `${mode}-${seed}-v0`,
  frozen: true,
  stopReason: "attempt limit reached",
});

const evaluation = (
  programId: string,
  pains: readonly [number | null, number | null],
): ProgramEvaluation => ({
  programId,
  benchmarkVersion: "t/1",
  manifestDigest: `sha256:${"1".repeat(64)}`,
  split: "test",
  summary: summary(pains[0]),
  runs: [
    run(programId, "generated-program", "a", "a-1", pains[0], null),
    run(programId, "generated-program", "b", "b-1", pains[1], null),
  ],
});

const index: ExperimentIndex = {
  schemaVersion: "bus20-experiment/1",
  id: "exp",
  benchmarkVersion: "t/1",
  manifestDigest: `sha256:${"1".repeat(64)}`,
  generator: { provider: "sample", modelId: "ladder" },
  testSplit: "test",
  heldOutCities: ["b"],
  budget: { maxGenerations: 3, maxEvaluations: 9, maxCostUsd: null },
  campaigns: [],
  references: [],
  amortization: { runsPerArtifact: [1, 10], onlinePreparationCostUsd: { llm: 5 } },
};

const references: SuiteIndex[] = [
  {
    schemaVersion: "bus20-suite-index/1",
    benchmarkVersion: "t/1",
    manifestDigest: index.manifestDigest,
    splits: ["test"],
    repetitions: 1,
    runs: [
      run("swift", "swift-reference", "a", "a-1", 4, null),
      run("swift", "swift-reference", "b", "b-1", 6, null),
    ],
  },
  {
    schemaVersion: "bus20-suite-index/1",
    benchmarkVersion: "t/1",
    manifestDigest: index.manifestDigest,
    splits: ["test"],
    repetitions: 1,
    runs: [
      run("llm", "general-llm", "a", "a-1", 3, 0.5),
      run("llm", "general-llm", "b", "b-1", null, 0.5),
    ],
  },
];

test("curves accumulate spend and track the incumbent; modes average across seeds", () => {
  const self = campaign("B-self", 1, [10, 8, 9], [true, true, false]);
  const analysis = analyzeExperiment(
    {
      index,
      campaigns: [{ campaign: self, testEvaluation: evaluation("B-self-1-v0", [2, 8]) }],
      references,
    },
    1,
  );
  const [curve] = analysis.curves;
  assert.ok(curve !== undefined);
  assert.deepEqual(
    curve.points.map((point) => point.incumbentDevPain),
    [10, 8, 8],
  );
  assert.deepEqual(
    curve.points.map((point) => point.costUsd.toFixed(1)),
    ["0.1", "0.2", "0.3"],
  );
  const [mode] = analysis.modes;
  assert.ok(mode !== undefined);
  assert.equal(mode.meanIncumbentDevPain, 8);
  assert.equal(mode.meanTestConditionalPain, 2);
  assert.equal(mode.meanCostUsd, 0.3);
});

test("test comparison pairs programs with the Swift reference and splits held-out cities", () => {
  const self = campaign("B-self", 1, [10], [true]);
  const analysis = analyzeExperiment(
    {
      index,
      campaigns: [{ campaign: self, testEvaluation: evaluation("B-self-1-v0", [2, 8]) }],
      references,
    },
    1,
  );
  assert.equal(analysis.referencePolicyId, "swift");
  const paired = analysis.testPaired.find((row) => row.policyId === "B-self#1" && row.city === "a");
  assert.equal(paired?.meanDifference, 2);
  const llmPaired = analysis.testPaired.find((row) => row.policyId === "llm" && row.city === "b");
  assert.equal(llmPaired?.onlyReferenceComplete, 1);
  const groups = analysis.generalization.map((row) => [row.group, row.conditionalMeanPain]);
  assert.deepEqual(groups, [
    ["seen", 2],
    ["held-out", 8],
  ]);
});

test("amortisation charges generation once for programs and preparation plus per-run cost for online policies", () => {
  const self = campaign("B-self", 1, [10], [true]);
  const analysis = analyzeExperiment(
    {
      index,
      campaigns: [{ campaign: self, testEvaluation: evaluation("B-self-1-v0", [2, 8]) }],
      references,
    },
    1,
  );
  const program = analysis.amortization.find((row) => row.policyId === "B-self#1");
  assert.ok(program !== undefined);
  assert.deepEqual(program.costPerRunByK, { "1": 0.3, "10": 0.03 });
  assert.equal(program.perRunProgramCpuMs, 10);
  const llm = analysis.amortization.find((row) => row.policyId === "llm");
  assert.deepEqual(llm?.costPerRunByK, { "1": 5.5, "10": 1 });
  const markdown = paper2Markdown(analysis);
  assert.match(markdown, /offline stand-in/);
  assert.match(markdown, /\| llm \| reference \| 5\.0000 \| 0\.5000 \| 0 \| 5\.5000 \| 1\.0000 \|/);
});
