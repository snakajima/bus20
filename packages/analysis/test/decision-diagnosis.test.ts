import assert from "node:assert/strict";
import { test } from "node:test";
import {
  candidateBucket,
  type DecisionDiagnostic,
  diagnosisMarkdown,
  summarizeDecisions,
} from "../src/decision-diagnosis.js";

const MIN2 = 60_000 ** 2;

const record = (overrides: Partial<DecisionDiagnostic>): DecisionDiagnostic => ({
  policyId: "p",
  scenarioId: "s",
  load: "low",
  repetition: 0,
  requestId: "r",
  candidates: 5,
  rank: 0,
  regretMs2: 0,
  chosen: { waitMinutes: 2, detourMinutes: 0, othersDelayed: 0, largestDelayMinutes: 0 },
  best: { waitMinutes: 2, detourMinutes: 0, othersDelayed: 0, largestDelayMinutes: 0 },
  ...overrides,
});

test("group summaries count ranks, regret, and the direction of errors", () => {
  const records = [
    record({}),
    record({ rank: 1, regretMs2: 4 * MIN2 }),
    record({
      rank: 4,
      regretMs2: 16 * MIN2,
      chosen: { waitMinutes: 0, detourMinutes: 1, othersDelayed: 2, largestDelayMinutes: 3 },
    }),
    record({ candidates: 1, load: "high" }),
  ];
  const [overall] = summarizeDecisions(records).overall;
  assert.ok(overall !== undefined);
  assert.equal(overall.decisions, 4);
  assert.equal(overall.bestShare, 0.5);
  assert.equal(overall.top3Share, 0.75);
  assert.equal(overall.bottomHalfShare, 0.25, "rank 4 of 5 is in the bottom half; n=1 is not");
  // Normalized rank ignores single-candidate decisions: (0 + 0.25 + 1) / 3.
  assert.ok(Math.abs(overall.meanNormalizedRank - 1.25 / 3) < 1e-12);
  assert.equal(overall.meanRegretMin2, 5);
  assert.equal(overall.medianRegretMin2, 0);
  assert.equal(overall.p90RegretMin2, 16);
  assert.equal(overall.waitBias, -0.5);
  assert.equal(overall.detourBias, 0.25);
  assert.equal(overall.othersDelayedBias, 0.5);
  assert.equal(overall.largestDelayBias, 0.75);
  const loads = summarizeDecisions(records).byLoad.map((s) => `${s.group}:${s.decisions}`);
  assert.deepEqual(loads, ["low:3", "high:1"]);
});

test("candidate buckets and per-policy confidence quartiles", () => {
  assert.deepEqual([1, 10, 11, 40, 41, 100, 101].map(candidateBucket), [
    "1-10",
    "1-10",
    "11-40",
    "11-40",
    "41-100",
    "41-100",
    "101+",
  ]);
  const jev = Array.from({ length: 8 }, (_, i) =>
    record({
      policyId: "jev",
      confidence: (i + 1) / 8,
      rank: i < 4 ? 3 : 0,
      regretMs2: i < 4 ? MIN2 : 0,
    }),
  );
  const llm = record({ policyId: "llm" });
  const diagnosis = summarizeDecisions([...jev, llm]);
  const quartiles = diagnosis.byConfidenceQuartile;
  assert.ok(
    quartiles.every((s) => s.policyId === "jev"),
    "only policies reporting confidence",
  );
  const lowest = quartiles.find((s) => s.group.startsWith("q1"));
  const highest = quartiles.find((s) => s.group.startsWith("q4"));
  assert.ok(lowest !== undefined && highest !== undefined);
  assert.equal(lowest.bestShare, 0);
  assert.equal(highest.bestShare, 1);
  const markdown = diagnosisMarkdown(diagnosis);
  assert.match(markdown, /## By reported confidence/);
  assert.match(markdown, /\| jev \| q4 \(highest\) \| 2 \| 100\.0% /);
});
