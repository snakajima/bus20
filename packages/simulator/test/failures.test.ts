import { type Action } from "@bus20/contracts/action";
import { type Observation } from "@bus20/contracts/observation";
import { type Stop } from "@bus20/contracts/stops";
import { ACTION_SCHEMA_VERSION } from "@bus20/contracts/versions";
import assert from "node:assert/strict";
import { test } from "node:test";
import { type Policy } from "../src/policy.js";
import { runSimulation } from "../src/run.js";
import {
  chooseAction,
  firstCandidatePolicy,
  functionPolicy,
  lineMap,
  makeScenario,
  MINUTE,
} from "./helpers.js";

const map = lineMap();
const twoRequests = () =>
  makeScenario(
    map,
    [{ id: "v1", node: "a", capacity: 1 }],
    [
      { id: "r1", at: 0, from: "a", to: "d" },
      { id: "r2", at: MINUTE, from: "b", to: "c" },
    ],
  );

const insert = (observation: Observation, stops: Stop[], vehicleId = "v1"): Action => ({
  kind: "insert",
  schemaVersion: ACTION_SCHEMA_VERSION,
  stateVersion: observation.stateVersion,
  vehicleId,
  stops,
});

const secondDecision = (build: (observation: Observation) => Action): Policy =>
  functionPolicy((observation) =>
    observation.decisionRequestId === "r2"
      ? build(observation)
      : chooseAction(observation, observation.candidates[0]?.id ?? "none"),
  );

const expectRejected = async (policy: Policy, reason: string): Promise<void> => {
  const log = await runSimulation(twoRequests(), map, policy);
  assert.equal(log.termination.kind, "failed");
  assert.equal(log.termination.reason, "invalidAction");
  assert.match(log.termination.detail, new RegExp(`^${reason}:`));
  const last = log.decisions[log.decisions.length - 1];
  assert.equal(last?.outcome.status, "rejected");
  // Rejections never mutate state: r2 was never assigned, and r1 is still in flight.
  assert.equal(log.journeys.length, 0);
};

test("stale state version is rejected", async () => {
  await expectRejected(
    secondDecision((observation) => ({
      ...chooseAction(observation, "v1:0:1"),
      stateVersion: observation.stateVersion + 1,
    })),
    "staleStateVersion",
  );
});

test("unknown candidate is rejected", async () => {
  await expectRejected(
    secondDecision((observation) => chooseAction(observation, "v9:0:1")),
    "unknownCandidate",
  );
});

test("insert that drops an existing commitment is rejected", async () => {
  await expectRejected(
    secondDecision((observation) =>
      insert(observation, [
        { requestId: "r2", kind: "pickup", nodeId: "b" },
        { requestId: "r2", kind: "dropoff", nodeId: "c" },
      ]),
    ),
    "commitmentDropped",
  );
});

test("insert that reorders existing commitments is rejected", async () => {
  const scenario = makeScenario(
    map,
    [{ id: "v1", node: "a" }],
    [
      { id: "r1", at: 0, from: "a", to: "d" },
      { id: "r2", at: 0, from: "b", to: "c" },
    ],
  );
  const policy = secondDecision((observation) => {
    const [pickup, dropoff] = observation.vehicles[0]?.stops ?? [];
    if (pickup === undefined || dropoff === undefined) {
      throw new Error("expected two committed stops");
    }
    return insert(observation, [
      dropoff,
      pickup,
      { requestId: "r2", kind: "pickup", nodeId: "b" },
      { requestId: "r2", kind: "dropoff", nodeId: "c" },
    ]);
  });
  const log = await runSimulation(scenario, map, policy);
  assert.equal(
    log.termination.kind === "failed" ? log.termination.detail.split(":")[0] : "",
    "commitmentReordered",
  );
});

test("drop-off before pickup, duplicate service, wrong nodes, and capacity are rejected", async () => {
  const kept = (observation: Observation): Stop[] => observation.vehicles[0]?.stops ?? [];
  await expectRejected(
    secondDecision((observation) =>
      insert(observation, [
        ...kept(observation),
        { requestId: "r2", kind: "dropoff", nodeId: "c" },
        { requestId: "r2", kind: "pickup", nodeId: "b" },
      ]),
    ),
    "dropoffBeforePickup",
  );
  await expectRejected(
    secondDecision((observation) =>
      insert(observation, [
        ...kept(observation),
        { requestId: "r2", kind: "pickup", nodeId: "b" },
        { requestId: "r2", kind: "dropoff", nodeId: "c" },
        { requestId: "r2", kind: "dropoff", nodeId: "c" },
      ]),
    ),
    "duplicateService",
  );
  await expectRejected(
    secondDecision((observation) =>
      insert(observation, [
        ...kept(observation),
        { requestId: "r2", kind: "pickup", nodeId: "a" },
        { requestId: "r2", kind: "dropoff", nodeId: "c" },
      ]),
    ),
    "malformed",
  );
  // r1 is on board (capacity 1) until d; boarding r2 before that exceeds capacity.
  await expectRejected(
    secondDecision((observation) =>
      insert(observation, [
        { requestId: "r2", kind: "pickup", nodeId: "b" },
        { requestId: "r2", kind: "dropoff", nodeId: "c" },
        ...kept(observation),
      ]),
    ),
    "capacityExceeded",
  );
});

test("unknown vehicle and foreign commitments are rejected", async () => {
  await expectRejected(
    secondDecision((observation) =>
      insert(
        observation,
        [
          { requestId: "r2", kind: "pickup", nodeId: "b" },
          { requestId: "r2", kind: "dropoff", nodeId: "c" },
        ],
        "v7",
      ),
    ),
    "unknownVehicle",
  );
  await expectRejected(
    secondDecision((observation) =>
      insert(observation, [
        ...(observation.vehicles[0]?.stops ?? []),
        { requestId: "r9", kind: "pickup", nodeId: "b" },
        { requestId: "r2", kind: "pickup", nodeId: "b" },
        { requestId: "r2", kind: "dropoff", nodeId: "c" },
      ]),
    ),
    "unknownRequest",
  );
});

test("policy exceptions fail the run as policyError", async () => {
  const policy: Policy = {
    descriptor: { id: "boom", kind: "fixture" },
    decide: () => Promise.reject(new Error("model unavailable")),
  };
  const log = await runSimulation(twoRequests(), map, policy);
  assert.deepEqual(log.termination, {
    kind: "failed",
    finalTimeMs: 0,
    reason: "policyError",
    detail: "model unavailable",
  });
});

test("decision budget exhaustion fails the run as budgetExceeded", async () => {
  const log = await runSimulation(twoRequests(), map, firstCandidatePolicy(), { maxDecisions: 1 });
  assert.equal(log.termination.kind === "failed" ? log.termination.reason : "", "budgetExceeded");
  assert.equal(log.decisions.length, 1);
});

test("unfinished passengers at the completion deadline fail the run", async () => {
  const scenario = makeScenario(
    map,
    [{ id: "v1", node: "d" }],
    [{ id: "r1", at: 0, from: "a", to: "b" }],
    { completionDeadlineMs: 2 * MINUTE },
  );
  const log = await runSimulation(scenario, map, firstCandidatePolicy());
  assert.equal(log.termination.kind === "failed" ? log.termination.reason : "", "deadlineExceeded");
  assert.equal(log.journeys.length, 0);
  // Physical events exactly at the deadline still run: with deadline 4 min the ride completes.
  const justEnough = makeScenario(
    map,
    [{ id: "v1", node: "d" }],
    [{ id: "r1", at: 0, from: "a", to: "b" }],
    {
      completionDeadlineMs: 4 * MINUTE,
    },
  );
  const ok = await runSimulation(justEnough, map, firstCandidatePolicy());
  assert.equal(ok.termination.kind, "drained");
  assert.equal(ok.journeys[0]?.dropoffTimeMs, 4 * MINUTE);
});
