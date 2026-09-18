import assert from "node:assert/strict";
import { test } from "node:test";
import { assertChoiceFits, buildDecisionBrief, MAX_CHOICE_OPTIONS } from "../src/decision-brief.js";
import { estimateCostUsd, TARIFFS, usageRecord } from "../src/pricing.js";

const committed = {
  requestId: "x",
  kind: "dropoff" as const,
  nodeId: "c",
  plannedArrivalTimeMs: 60_000,
};
const pickup = {
  requestId: "r1",
  kind: "pickup" as const,
  nodeId: "a",
  plannedArrivalTimeMs: 60_000,
};
const dropoff = {
  requestId: "r1",
  kind: "dropoff" as const,
  nodeId: "b",
  plannedArrivalTimeMs: 150_000,
};

/** Insertions of r1 around one committed stop: index 0 = before it, index 1 = after it. */
const candidate = (index: number) => ({
  id: `v1:${index}:${index + 1}`,
  vehicleId: "v1",
  stops:
    index === 0
      ? [pickup, dropoff, { ...committed, plannedArrivalTimeMs: 240_000 }]
      : [
          committed,
          { ...pickup, plannedArrivalTimeMs: 120_000 },
          { ...dropoff, plannedArrivalTimeMs: 210_000 },
        ],
});

const observation = (count: number) => ({
  schemaVersion: "bus20-observation/1" as const,
  scenarioId: "s",
  stateVersion: 0,
  nowMs: 30_000,
  decisionRequestId: "r1",
  vehicles: [
    {
      id: "v1",
      capacity: 4,
      position: { kind: "atNode" as const, nodeId: "a" },
      onboardRequestIds: ["x"],
      stops: [committed],
    },
  ],
  requests: [
    {
      id: "r1",
      requestTimeMs: 30_000,
      originNodeId: "a",
      destinationNodeId: "b",
      phase: "waiting" as const,
      directTravelTimeMs: 90_000,
    },
    {
      id: "x",
      requestTimeMs: 0,
      originNodeId: "b",
      destinationNodeId: "c",
      phase: "onboard" as const,
      directTravelTimeMs: 60_000,
    },
  ],
  // Only the count matters for limit tests; the two-candidate brief test needs distinct ids.
  candidates: Array.from({ length: count }, (_, index) => candidate(index % 2 === 0 ? 0 : 1)),
});

test("brief converts times to minutes and keeps candidate order", () => {
  const brief = buildDecisionBrief(observation(2));
  assert.equal(brief["nowMinutes"], 0.5);
  assert.equal(brief["promptVersion"], "bus20-prompt/2");
  const candidates = brief["candidates"];
  assert.ok(Array.isArray(candidates));
  assert.deepEqual(
    candidates.map((item) =>
      typeof item === "object" && item !== null && !Array.isArray(item) ? item["id"] : null,
    ),
    ["v1:0:1", "v1:1:2"],
  );
  assert.equal(JSON.stringify(brief).includes("2.5"), true, "arrival at 150 s is 2.5 min");
});

test("choice limits are enforced instead of pruning", () => {
  assert.doesNotThrow(() => {
    assertChoiceFits(observation(MAX_CHOICE_OPTIONS).candidates.length, "candidates");
  });
  assert.throws(() => {
    assertChoiceFits(observation(MAX_CHOICE_OPTIONS + 1).candidates.length, "candidates");
  }, /exceed the 255-option limit/);
  assert.throws(() => {
    assertChoiceFits(0, "candidates");
  }, /no legal candidates/);
});

test("pricing uses pinned tariffs and refuses to guess", () => {
  assert.equal(estimateCostUsd("claude-opus-5", { inputTokens: 1_000_000, outputTokens: 0 }), 5);
  assert.equal(
    estimateCostUsd("jev-1.13.0", { inputTokens: 1_000_000, outputTokens: 1_000_000 }),
    0.084,
  );
  assert.equal(estimateCostUsd("unknown-model", { inputTokens: 10, outputTokens: 10 }), undefined);
  assert.ok(Object.values(TARIFFS).every((tariff) => tariff.retrievedAt.length === 10));
  const record = usageRecord("unknown-model", { inputTokens: 3, outputTokens: 4 }, { extra: 1 });
  assert.deepEqual(record, { inputTokens: 3, outputTokens: 4, extra: 1 });
});
