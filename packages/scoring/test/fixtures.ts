import { digestDocument } from "@bus20/contracts/digest";
import { type MapDocument, validateMapDocument } from "@bus20/contracts/map";
import { type Journey, type RunLog, type RunTermination } from "@bus20/contracts/run-log";
import { type ScenarioDocument, validateScenarioDocument } from "@bus20/contracts/scenario";
import { readFileSync } from "node:fs";
import path from "node:path";
import { directTravelTimes } from "../src/direct-travel.js";

// Tests run from dist/test, four levels below the repository root.
const FIXTURE_ROOT = path.resolve(import.meta.dirname, "../../../../datasets/fixtures");

const readJson = (relative: string): unknown =>
  JSON.parse(readFileSync(path.join(FIXTURE_ROOT, relative), "utf8"));

export const loadGridMap = (): MapDocument => {
  const result = validateMapDocument(readJson("maps/grid3x3/v1/map.json"));
  if (!result.ok) {
    throw new Error("fixture map is invalid");
  }
  return result.value;
};

export const loadSmokeScenario = (): ScenarioDocument => {
  const result = validateScenarioDocument(readJson("scenarios/smoke/smoke-01.json"));
  if (!result.ok) {
    throw new Error("fixture scenario is invalid");
  }
  return result.value;
};

export const FIXTURE_POLICY = { id: "fixture-smoke", kind: "fixture" } as const;

export const makeLog = (
  scenario: ScenarioDocument,
  map: MapDocument,
  journeys: readonly Journey[],
  termination: RunTermination = { kind: "drained", finalTimeMs: 0 },
): RunLog => ({
  schemaVersion: "bus20-run-log/1",
  protocolVersion: "bus20-protocol/1",
  scenarioId: scenario.id,
  scenarioDigest: digestDocument(scenario),
  mapDigest: digestDocument(map),
  policy: FIXTURE_POLICY,
  termination,
  journeys: [...journeys],
  decisions: [],
});

/**
 * Journeys where every passenger waits `waitMs` and rides the direct time
 * plus `detourMs`. Pain per passenger is then ((waitMs + detourMs) / 60000)².
 */
export const uniformJourneys = (
  scenario: ScenarioDocument,
  map: MapDocument,
  waitMs: number,
  detourMs: number,
): Journey[] => {
  const direct = directTravelTimes(map, scenario.requests);
  return scenario.requests.map((request) => {
    const pickupTimeMs = request.requestTimeMs + waitMs;
    return {
      requestId: request.id,
      vehicleId: "v1",
      pickupTimeMs,
      dropoffTimeMs: pickupTimeMs + (direct.get(request.id) ?? 0) + detourMs,
    };
  });
};
