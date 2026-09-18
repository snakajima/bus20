import assert from "node:assert/strict";
import { test } from "node:test";
import {
  type RideRequest,
  sortRequestsByRelease,
  validateScenarioDocument,
} from "../src/scenario.js";
import { asArray, asObject, loadSmokeScenario, mutatedClone } from "./fixtures.js";

const withMutation = (mutate: (doc: Record<string, unknown>) => void): unknown =>
  mutatedClone(loadSmokeScenario(), mutate);

const issueText = (value: unknown): string => {
  const result = validateScenarioDocument(value);
  return result.ok ? "" : result.issues.map((item) => `${item.path}: ${item.message}`).join("\n");
};

test("fixture scenario validates", () => {
  const result = validateScenarioDocument(loadSmokeScenario());
  assert.equal(result.ok, true);
  assert.equal(result.value.requests.length, 12);
  assert.equal(result.value.vehicles.length, 2);
});

test("scenario rejects empty demand, multi-passenger requests, and bad timelines", () => {
  assert.match(
    issueText(
      withMutation((doc) => {
        doc["requests"] = [];
      }),
    ),
    /^requests: /m,
  );
  const twoPassengers = withMutation((doc) => {
    const requests = asArray(doc["requests"]);
    requests[0] = { ...asObject(requests[0]), passengers: 2 };
  });
  assert.match(issueText(twoPassengers), /requests\.0\.passengers/);
  const deadlineTooEarly = withMutation((doc) => {
    doc["completionDeadlineMs"] = 1000;
  });
  assert.match(issueText(deadlineTooEarly), /completionDeadlineMs: must not precede/);
});

test("scenario rejects duplicate ids, same-node trips, and requests outside the demand window", () => {
  const duplicated = withMutation((doc) => {
    const requests = asArray(doc["requests"]);
    requests.push({ ...asObject(requests[0]) });
  });
  assert.match(issueText(duplicated), /duplicate request id "r01"/);
  const sameNode = withMutation((doc) => {
    const requests = asArray(doc["requests"]);
    requests[1] = { ...asObject(requests[1]), destinationNodeId: "n22" };
  });
  assert.match(issueText(sameNode), /identical origin and destination/);
  const late = withMutation((doc) => {
    const requests = asArray(doc["requests"]);
    requests[2] = { ...asObject(requests[2]), requestTimeMs: 600001 };
  });
  assert.match(issueText(late), /requests\.2\.requestTimeMs: outside/);
});

test("release order is by time, then by ID with code-point comparison", () => {
  const make = (id: string, requestTimeMs: number): RideRequest => ({
    id,
    requestTimeMs,
    originNodeId: "a",
    destinationNodeId: "b",
    passengers: 1,
  });
  const ordered = sortRequestsByRelease([
    make("r2", 5),
    make("r10", 5),
    make("r9", 1),
    make("R1", 5),
  ]);
  assert.deepEqual(
    ordered.map((request) => request.id),
    ["r9", "R1", "r10", "r2"],
  );
});
