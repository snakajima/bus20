import { type ScenarioDocument } from "@bus20/contracts/scenario";
import assert from "node:assert/strict";
import { test } from "node:test";
import { checkScenarioOnMap } from "../src/scenario-check.js";
import { loadGridMap, loadSmokeScenario, makeMap } from "./fixtures.js";

const withRequestChange = (
  scenario: ScenarioDocument,
  index: number,
  change: Partial<ScenarioDocument["requests"][number]>,
): ScenarioDocument => ({
  ...scenario,
  requests: scenario.requests.map((request, i) =>
    i === index ? { ...request, ...change } : request,
  ),
});

test("smoke scenario is consistent with the fixture map", () => {
  assert.deepEqual(checkScenarioOnMap(loadSmokeScenario(), loadGridMap()), []);
});

test("scenario check rejects digest mismatch and stops at non-stop nodes", () => {
  const scenario = loadSmokeScenario();
  const map = loadGridMap();
  const wrongDigest = { ...scenario, map: { ...scenario.map, digest: `sha256:${"0".repeat(64)}` } };
  assert.match(checkScenarioOnMap(wrongDigest, map)[0]?.message ?? "", /scenario expects sha256:0/);

  const junctionStop = withRequestChange(scenario, 0, { destinationNodeId: "n11" });
  const messages = checkScenarioOnMap(junctionStop, map).map((item) => item.message);
  assert.deepEqual(messages, ['node "n11" does not allow stops']);

  const unknownNode = withRequestChange(scenario, 3, { originNodeId: "n99" });
  assert.match(checkScenarioOnMap(unknownNode, map)[0]?.message ?? "", /unknown node "n99"/);
});

test("scenario check enforces reachability from every vehicle and origin to destination", () => {
  const map = makeMap([
    ["a-b", "a", "b", 10],
    ["b-c", "b", "c", 10],
    ["c-b", "c", "b", 10],
  ]);
  const base = {
    schemaVersion: "bus20-scenario/1",
    id: "reach",
    startTimeMs: 0,
    demandEndTimeMs: 0,
    completionDeadlineMs: 1000,
    provenance: {},
  } as const;
  const mapRef = { id: map.id, digest: `sha256:${"0".repeat(64)}` };
  const scenario: ScenarioDocument = {
    ...base,
    map: mapRef,
    vehicles: [
      { id: "v1", nodeId: "a", capacity: 1 },
      { id: "v2", nodeId: "c", capacity: 1 },
    ],
    requests: [
      { id: "r1", requestTimeMs: 0, originNodeId: "a", destinationNodeId: "c", passengers: 1 },
      { id: "r2", requestTimeMs: 0, originNodeId: "b", destinationNodeId: "a", passengers: 1 },
    ],
  };
  const messages = checkScenarioOnMap(scenario, map)
    .filter((item) => item.path.startsWith("requests"))
    .map((item) => `${item.path}: ${item.message}`);
  assert.deepEqual(messages, [
    'requests.0: origin "a" is not reachable from every vehicle',
    'requests.1: destination "a" is not reachable from origin',
  ]);
});
