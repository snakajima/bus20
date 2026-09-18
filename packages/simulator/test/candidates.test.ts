import assert from "node:assert/strict";
import { test } from "node:test";
import { enumerateCandidates } from "../src/candidates.js";
import { Routing } from "../src/routing.js";
import { createInitialState, findVehicle } from "../src/state.js";
import { lineMap, makeScenario, MINUTE } from "./helpers.js";

test("candidate count is (n+1)(n+2)/2 per vehicle with room, ordered by vehicle then indices", () => {
  const map = lineMap();
  const scenario = makeScenario(
    map,
    [
      { id: "v2", node: "a" },
      { id: "v1", node: "d" },
    ],
    [{ id: "r1", at: 0, from: "b", to: "c" }],
  );
  const state = createInitialState(scenario);
  const v1 = findVehicle(state, "v1");
  if (v1 === undefined) {
    throw new Error("missing vehicle");
  }
  v1.stops = [
    { requestId: "x", kind: "pickup", nodeId: "c" },
    { requestId: "x", kind: "dropoff", nodeId: "a" },
  ];
  const [request] = scenario.requests;
  if (request === undefined) {
    throw new Error("missing request");
  }
  const candidates = enumerateCandidates(new Routing(map), state, request);
  const ids = candidates.map((candidate) => candidate.id);
  assert.deepEqual(ids.slice(0, 6), ["v1:0:1", "v1:0:2", "v1:0:3", "v1:1:2", "v1:1:3", "v1:2:3"]);
  assert.deepEqual(ids.slice(6), ["v2:0:1"]);
  const appended = candidates.find((candidate) => candidate.id === "v2:0:1");
  assert.deepEqual(
    appended?.stops.map((stop) => stop.plannedArrivalTimeMs),
    [MINUTE, 2 * MINUTE],
  );
  for (const candidate of candidates) {
    assert.ok(!("pain" in candidate) && !("cost" in candidate));
  }
});
