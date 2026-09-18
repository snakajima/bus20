import { type SuiteIndex, type SuiteRun } from "@bus20/contracts/suite-index";
import assert from "node:assert/strict";
import { test } from "node:test";
import { summarizeAcrossCities, summarizeCells, summarizePaired } from "../src/aggregate.js";
import { analysisMarkdown, analyzeSuite } from "../src/report.js";
import { bootstrapMeanInterval, mean } from "../src/statistics.js";

const run = (
  policyId: string,
  city: string,
  load: string,
  scenarioId: string,
  pain: number | null,
  repetition = 0,
): SuiteRun => ({
  policy: { id: policyId, kind: policyId === "ref" ? "swift-reference" : "general-llm" },
  scenario: {
    id: scenarioId,
    path: `${scenarioId}.json`,
    digest: `sha256:${"0".repeat(64)}`,
    mapId: city,
    city,
    load: load === "low" ? "low" : "high",
    pattern: "uniform",
    split: "dev",
    seed: 1,
    requestCount: 10,
    vehicleCount: 2,
  },
  repetition,
  dir: `${policyId}/${scenarioId}/rep-${repetition}`,
  status: pain === null ? "failed" : "complete",
  pain,
  failureReason: pain === null ? "deadlineExceeded" : null,
  failureDetail: pain === null ? "unfinished" : null,
  completedCount: pain === null ? 5 : 10,
  requestCount: 10,
  decisions: 10,
  latencyMedianMs: 100,
  latencyP95Ms: 200,
  inputTokens: 1000,
  outputTokens: 10,
  costUsd: policyId === "ref" ? null : 0.01,
  programCpuMs: 0,
  replayMatches: true,
});

const index = (): SuiteIndex => ({
  schemaVersion: "bus20-suite-index/1",
  benchmarkVersion: "test/1",
  manifestDigest: `sha256:${"1".repeat(64)}`,
  splits: ["dev"],
  repetitions: 1,
  runs: [
    run("ref", "a", "low", "a-1", 4),
    run("ref", "a", "low", "a-2", 8),
    run("ref", "a", "low", "a-3", 0),
    run("llm", "a", "low", "a-1", 2),
    run("llm", "a", "low", "a-2", 10),
    run("llm", "a", "low", "a-3", 1),
    run("ref", "b", "low", "b-1", 6),
    run("ref", "b", "low", "b-2", 6),
    run("llm", "b", "low", "b-1", null),
    run("llm", "b", "low", "b-2", 3),
  ],
});

test("cells report success rate first and pain as a conditional statistic", () => {
  const cells = summarizeCells(index(), 1);
  const llmB = cells.find((cell) => cell.policyId === "llm" && cell.city === "b");
  assert.ok(llmB !== undefined);
  assert.equal(llmB.runs, 2);
  assert.equal(llmB.successRate, 0.5);
  assert.equal(llmB.conditionalMeanPain, 3);
  assert.equal(llmB.painInterval, null);
  assert.deepEqual(llmB.failureReasons, { deadlineExceeded: 1 });
  assert.equal(llmB.meanCostUsd, 0.01);
  const refA = cells.find((cell) => cell.policyId === "ref" && cell.city === "a");
  assert.ok(refA !== undefined);
  assert.equal(refA.conditionalMeanPain, 4);
  assert.equal(refA.meanCostUsd, null);
});

test("paired summary uses identical scenarios, counts failures, and handles zero reference pain", () => {
  const paired = summarizePaired(index(), "ref", 1);
  const cityA = paired.find((row) => row.city === "a");
  assert.ok(cityA !== undefined);
  assert.equal(cityA.pairs, 3);
  assert.equal(cityA.bothComplete, 3);
  // differences: 4-2=2, 8-10=-2, 0-1=-1 -> mean -1/3; improvement% only for the first two.
  assert.ok(Math.abs((cityA.meanDifference ?? 0) - -1 / 3) < 1e-12);
  assert.equal(cityA.meanImprovementPercent, (50 + -25) / 2);
  assert.equal(cityA.policyWins, 1);
  const cityB = paired.find((row) => row.city === "b");
  assert.ok(cityB !== undefined);
  assert.equal(cityB.pairs, 2);
  assert.equal(cityB.bothComplete, 1);
  assert.equal(cityB.onlyReferenceComplete, 1);
  assert.equal(cityB.onlyPolicyComplete, 0);
  assert.equal(cityB.meanDifference, 3);
  assert.equal(cityB.differenceInterval, null);
});

test("cross-city rows weight cities equally and blank pain when a city has none", () => {
  const cells = summarizeCells(index(), 1);
  const across = summarizeAcrossCities(cells);
  const llm = across.find((row) => row.policyId === "llm");
  assert.ok(llm !== undefined);
  assert.equal(llm.cities, 2);
  assert.equal(llm.successRate, (1 + 0.5) / 2);
  assert.ok(Math.abs((llm.conditionalMeanPain ?? 0) - (13 / 3 + 3) / 2) < 1e-12);
});

test("bootstrap intervals are seeded, bracket the mean, and need at least two values", () => {
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const first = bootstrapMeanInterval(values, 42);
  const second = bootstrapMeanInterval(values, 42);
  assert.deepEqual(first, second);
  assert.ok(first !== null);
  assert.ok(first.lower <= mean(values) && mean(values) <= first.upper);
  assert.ok(first.lower > 1 && first.upper < 10);
  assert.notDeepEqual(first, bootstrapMeanInterval(values, 43));
  assert.equal(bootstrapMeanInterval([5], 1), null);
});

test("markdown artifact labels conditional pain and keeps failures visible", () => {
  const analysis = analyzeSuite(index(), "ref", 1);
  const markdown = analysisMarkdown(analysis);
  assert.match(markdown, /complete runs only/);
  assert.match(
    markdown,
    /\| llm \| b \| low \| 2 \| 50% \| 3\.00 \| n\/a \| 0\.0100 \| 100 \| deadlineExceeded:1 \|/,
  );
  assert.match(
    markdown,
    /\| llm \| b \| low \| 2 \| 1 \| 1 \| 0 \| 3\.00 \| n\/a \| 50\.0 \| 1\/1 \|/,
  );
  assert.equal(
    analysis.paired.every((row) => row.referencePolicyId === "ref"),
    true,
  );
});
