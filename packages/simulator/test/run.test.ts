import { type Stop } from "@bus20/contracts/stops";
import { ACTION_SCHEMA_VERSION } from "@bus20/contracts/versions";
import { sortIds } from "@bus20/contracts/ids";
import assert from "node:assert/strict";
import { test } from "node:test";
import { createFixturePolicy } from "../src/fixture-policy.js";
import { runSimulation } from "../src/run.js";
import {
  chooseAction,
  firstCandidatePolicy,
  functionPolicy,
  lineMap,
  loadGridMap,
  loadSmokeScenario,
  makeScenario,
  MINUTE,
} from "./helpers.js";

const journeyOf = (log: Awaited<ReturnType<typeof runSimulation>>, id: string) =>
  log.journeys.find((journey) => journey.requestId === id);

test("immediate pickup and direct ride: vehicle at origin, one request", async () => {
  const map = lineMap();
  const scenario = makeScenario(
    map,
    [{ id: "v1", node: "a" }],
    [{ id: "r1", at: 0, from: "a", to: "c" }],
  );
  const log = await runSimulation(scenario, map, firstCandidatePolicy());
  assert.equal(log.termination.kind, "drained");
  assert.deepEqual(journeyOf(log, "r1"), {
    requestId: "r1",
    vehicleId: "v1",
    pickupTimeMs: 0,
    dropoffTimeMs: 2 * MINUTE,
  });
  assert.equal(log.termination.finalTimeMs, 2 * MINUTE);
});

test("vehicle away from the origin: wait equals the deadhead time", async () => {
  const map = lineMap();
  const scenario = makeScenario(
    map,
    [{ id: "v1", node: "d" }],
    [{ id: "r1", at: 5 * MINUTE, from: "b", to: "a" }],
  );
  const log = await runSimulation(scenario, map, firstCandidatePolicy());
  assert.deepEqual(journeyOf(log, "r1"), {
    requestId: "r1",
    vehicleId: "v1",
    pickupTimeMs: 7 * MINUTE,
    dropoffTimeMs: 8 * MINUTE,
  });
});

test("same-timestamp order: drop-off frees capacity before the pickup at the same node", async () => {
  const map = lineMap();
  // v1 (capacity 1) carries r1 from a to b; r2 appears at b exactly when v1 arrives.
  const scenario = makeScenario(
    map,
    [{ id: "v1", node: "a", capacity: 1 }],
    [
      { id: "r1", at: 0, from: "a", to: "b" },
      { id: "r2", at: MINUTE, from: "b", to: "c" },
    ],
  );
  const policy = firstCandidatePolicy();
  const log = await runSimulation(scenario, map, policy);
  assert.equal(log.termination.kind, "drained");
  assert.deepEqual(journeyOf(log, "r1"), {
    requestId: "r1",
    vehicleId: "v1",
    pickupTimeMs: 0,
    dropoffTimeMs: MINUTE,
  });
  assert.deepEqual(journeyOf(log, "r2"), {
    requestId: "r2",
    vehicleId: "v1",
    pickupTimeMs: MINUTE,
    dropoffTimeMs: 2 * MINUTE,
  });
  // When r2 is decided, r1 has already alighted, so the only legal candidate is a fresh append.
  const second = policy.seen[1];
  assert.ok(second !== undefined);
  assert.equal(second.vehicles[0]?.onboardRequestIds.length, 0);
  assert.equal(second.candidates.length, 1);
});

test("capacity is enforced while a passenger is on board", async () => {
  const map = lineMap();
  const scenario = makeScenario(
    map,
    [{ id: "v1", node: "a", capacity: 1 }],
    [
      { id: "r1", at: 0, from: "a", to: "d" },
      { id: "r2", at: 0, from: "a", to: "b" },
    ],
  );
  const policy = firstCandidatePolicy();
  const log = await runSimulation(scenario, map, policy);
  const second = policy.seen[1];
  // r1 is assigned (not yet on board) with stops [pickup a, dropoff d]. Boarding r2 while
  // r1 rides exceeds capacity, so only "r2 entirely before r1" and "entirely after" survive.
  assert.deepEqual(
    second?.candidates.map((candidate) => candidate.id),
    ["v1:0:1", "v1:2:3"],
  );
  assert.equal(log.termination.kind, "drained");
  assert.equal(journeyOf(log, "r2")?.pickupTimeMs, 0);
  assert.equal(journeyOf(log, "r1")?.pickupTimeMs, 2 * MINUTE);
});

test("simultaneous releases are decided in ID order with all of them visible", async () => {
  const map = lineMap();
  const scenario = makeScenario(
    map,
    [{ id: "v1", node: "a" }],
    [
      { id: "r2", at: 0, from: "a", to: "b" },
      { id: "r10", at: 0, from: "b", to: "c" },
      { id: "r1", at: 0, from: "c", to: "d" },
    ],
  );
  const policy = firstCandidatePolicy();
  await runSimulation(scenario, map, policy);
  assert.deepEqual(
    policy.seen.map((observation) => observation.decisionRequestId),
    ["r1", "r10", "r2"],
  );
  const first = policy.seen[0];
  assert.ok(first !== undefined);
  assert.deepEqual(sortIds(first.requests.map((request) => request.id)), ["r1", "r10", "r2"]);
  assert.deepEqual(
    first.requests.map((request) => request.phase),
    ["waiting", "waiting", "waiting"],
  );
});

test("unreleased requests never appear in any observation", async () => {
  const scenario = loadSmokeScenario();
  const policy = firstCandidatePolicy();
  await runSimulation(scenario, loadGridMap(), policy);
  for (const observation of policy.seen) {
    for (const request of observation.requests) {
      assert.ok(
        request.requestTimeMs <= observation.nowMs,
        `${request.id} leaked at ${observation.nowMs}`,
      );
    }
    assert.ok(!observation.requests.some((request) => request.phase === "completed"));
  }
  assert.equal(policy.seen.length, scenario.requests.length);
});

test("mid-edge replanning keeps the arrival time and applies at the edge end", async () => {
  const map = lineMap();
  // v1 leaves a for d at t=0 carrying r1. At t=30s, r2 appears at b: v1 is mid-edge a->b.
  const scenario = makeScenario(
    map,
    [{ id: "v1", node: "a" }],
    [
      { id: "r1", at: 0, from: "a", to: "d" },
      { id: "r2", at: MINUTE / 2, from: "b", to: "c" },
    ],
  );
  const policy = functionPolicy((observation) => {
    const insertFirst = observation.candidates.find((candidate) => candidate.id === "v1:0:1");
    return chooseAction(observation, insertFirst?.id ?? observation.candidates[0]?.id ?? "none");
  });
  const log = await runSimulation(scenario, map, policy);
  const second = policy.seen[1];
  assert.ok(second !== undefined);
  assert.deepEqual(second.vehicles[0]?.position, {
    kind: "onEdge",
    edgeId: "a-b",
    fromNodeId: "a",
    toNodeId: "b",
    arrivalTimeMs: MINUTE,
  });
  const chosen = second.candidates.find((candidate) => candidate.id === "v1:0:1");
  assert.deepEqual(
    chosen?.stops.map((stop) => stop.plannedArrivalTimeMs),
    [MINUTE, 2 * MINUTE, 3 * MINUTE],
  );
  assert.deepEqual(journeyOf(log, "r2"), {
    requestId: "r2",
    vehicleId: "v1",
    pickupTimeMs: MINUTE,
    dropoffTimeMs: 2 * MINUTE,
  });
  assert.deepEqual(journeyOf(log, "r1"), {
    requestId: "r1",
    vehicleId: "v1",
    pickupTimeMs: 0,
    dropoffTimeMs: 3 * MINUTE,
  });
});

test("insert actions are validated like candidates and commitments are preserved", async () => {
  const map = lineMap();
  const scenario = makeScenario(
    map,
    [{ id: "v1", node: "a" }],
    [
      { id: "r1", at: 0, from: "a", to: "d" },
      { id: "r2", at: 0, from: "b", to: "c" },
    ],
  );
  const policy = functionPolicy((observation) => {
    const vehicle = observation.vehicles[0];
    const request = observation.requests.find((item) => item.id === observation.decisionRequestId);
    if (vehicle === undefined || request === undefined) {
      throw new Error("bad observation");
    }
    const stops: Stop[] = [
      ...vehicle.stops,
      { requestId: request.id, kind: "pickup", nodeId: request.originNodeId },
      { requestId: request.id, kind: "dropoff", nodeId: request.destinationNodeId },
    ];
    return {
      kind: "insert",
      schemaVersion: ACTION_SCHEMA_VERSION,
      stateVersion: observation.stateVersion,
      vehicleId: "v1",
      stops,
    };
  });
  const log = await runSimulation(scenario, map, policy);
  assert.equal(log.termination.kind, "drained");
  assert.deepEqual(
    log.decisions.map((decision) => decision.outcome.status),
    ["accepted", "accepted"],
  );
  assert.equal(journeyOf(log, "r2")?.pickupTimeMs, 5 * MINUTE);
});

test("fixture policy completes the smoke scenario deterministically", async () => {
  const scenario = loadSmokeScenario();
  const map = loadGridMap();
  const first = await runSimulation(scenario, map, createFixturePolicy());
  const second = await runSimulation(scenario, map, createFixturePolicy());
  assert.equal(first.termination.kind, "drained");
  assert.equal(first.journeys.length, 12);
  assert.deepEqual(first.journeys, second.journeys);
  assert.equal(first.finalStateDigest, second.finalStateDigest);
  const stripped = (log: typeof first) =>
    log.decisions.map(({ wallLatencyMs: _w, ...rest }) => rest);
  assert.deepEqual(stripped(first), stripped(second));
});
