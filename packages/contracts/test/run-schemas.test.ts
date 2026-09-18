import assert from "node:assert/strict";
import { test } from "node:test";
import { actionSchema } from "../src/action.js";
import { validateWithSchema } from "../src/json.js";
import { observationSchema } from "../src/observation.js";
import { runLogSchema } from "../src/run-log.js";
import { runResultSchema } from "../src/run-result.js";

test("actions require the state version they were decided on", () => {
  const good = validateWithSchema(actionSchema, {
    kind: "chooseCandidate",
    schemaVersion: "bus20-action/1",
    stateVersion: 3,
    candidateId: "c1",
  });
  assert.equal(good.ok, true);
  const missingVersion = validateWithSchema(actionSchema, {
    kind: "chooseCandidate",
    schemaVersion: "bus20-action/1",
    candidateId: "c1",
  });
  assert.equal(missingVersion.ok, false);
  const shortInsert = validateWithSchema(actionSchema, {
    kind: "insert",
    schemaVersion: "bus20-action/1",
    stateVersion: 0,
    vehicleId: "v1",
    stops: [{ requestId: "r1", kind: "pickup", nodeId: "n00" }],
  });
  assert.equal(shortInsert.ok, false);
});

test("observations carry candidates without any cost field", () => {
  const result = validateWithSchema(observationSchema, {
    schemaVersion: "bus20-observation/1",
    scenarioId: "s",
    stateVersion: 0,
    nowMs: 0,
    decisionRequestId: "r1",
    vehicles: [
      {
        id: "v1",
        capacity: 4,
        position: { kind: "atNode", nodeId: "n00" },
        onboardRequestIds: [],
        stops: [],
      },
    ],
    requests: [
      {
        id: "r1",
        requestTimeMs: 0,
        originNodeId: "n00",
        destinationNodeId: "n02",
        phase: "waiting",
        directTravelTimeMs: 120000,
      },
    ],
    candidates: [
      {
        id: "c1",
        vehicleId: "v1",
        stops: [
          { requestId: "r1", kind: "pickup", nodeId: "n00", plannedArrivalTimeMs: 0 },
          { requestId: "r1", kind: "dropoff", nodeId: "n02", plannedArrivalTimeMs: 120000 },
        ],
      },
    ],
  });
  assert.equal(result.ok, true);
});

test("run results are either complete with a number or failed with null pain", () => {
  const base = {
    schemaVersion: "bus20-run-result/1",
    protocolVersion: "bus20-protocol/1",
    scenarioId: "s",
    policy: { id: "fixture", kind: "fixture" },
    requestCount: 1,
    completedCount: 0,
  };
  const failedOk = validateWithSchema(runResultSchema, {
    ...base,
    status: "failed",
    pain: null,
    failure: { reason: "unservedRequests", detail: "r1" },
  });
  assert.equal(failedOk.ok, true);
  const failedWithNumber = validateWithSchema(runResultSchema, {
    ...base,
    status: "failed",
    pain: 12,
    failure: { reason: "unservedRequests", detail: "r1" },
  });
  assert.equal(failedWithNumber.ok, false);
  const completeWithNull = validateWithSchema(runResultSchema, {
    ...base,
    status: "complete",
    pain: null,
    passengers: [],
    summary: {},
  });
  assert.equal(completeWithNull.ok, false);
});

test("run logs pin protocol, scenario, and map versions", () => {
  const result = validateWithSchema(runLogSchema, {
    schemaVersion: "bus20-run-log/1",
    protocolVersion: "bus20-protocol/1",
    scenarioId: "s",
    scenarioDigest: `sha256:${"0".repeat(64)}`,
    mapDigest: `sha256:${"1".repeat(64)}`,
    policy: { id: "fixture", kind: "fixture" },
    termination: { kind: "drained", finalTimeMs: 10 },
    journeys: [],
    decisions: [],
  });
  assert.equal(result.ok, true);
  const unpinned = validateWithSchema(runLogSchema, { schemaVersion: "bus20-run-log/1" });
  assert.equal(unpinned.ok, false);
});
