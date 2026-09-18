import { type Action } from "@bus20/contracts/action";
import { type MapDocument, validateMapDocument } from "@bus20/contracts/map";
import { type Observation } from "@bus20/contracts/observation";
import { type ScenarioDocument, validateScenarioDocument } from "@bus20/contracts/scenario";
import { digestDocument } from "@bus20/contracts/digest";
import { ACTION_SCHEMA_VERSION } from "@bus20/contracts/versions";
import { readFileSync } from "node:fs";
import path from "node:path";
import { type Policy } from "../src/policy.js";

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

export const MINUTE = 60000;

/** Line map a -> b -> c -> d with 60 s edges in both directions; all nodes are stops. */
export const lineMap = (): MapDocument => {
  const ids = ["a", "b", "c", "d"];
  const edges = ids.slice(0, -1).flatMap((from, index) => {
    const to = ids[index + 1] ?? from;
    return [
      { id: `${from}-${to}`, from, to, travelTimeMs: MINUTE },
      { id: `${to}-${from}`, from: to, to: from, travelTimeMs: MINUTE },
    ];
  });
  return {
    schemaVersion: "bus20-map/1",
    id: "line4",
    nodes: ids.map((id) => ({ id, stopAllowed: true })),
    edges,
  };
};

export interface RequestSpec {
  readonly id: string;
  readonly at: number;
  readonly from: string;
  readonly to: string;
}

export interface VehicleSpec {
  readonly id: string;
  readonly node: string;
  readonly capacity?: number;
}

export const makeScenario = (
  map: MapDocument,
  vehicles: readonly VehicleSpec[],
  requests: readonly RequestSpec[],
  overrides: Partial<Pick<ScenarioDocument, "completionDeadlineMs" | "demandEndTimeMs">> = {},
): ScenarioDocument => {
  const lastRelease = Math.max(...requests.map((request) => request.at));
  return {
    schemaVersion: "bus20-scenario/1",
    id: "test",
    map: { id: map.id, digest: digestDocument(map) },
    startTimeMs: 0,
    demandEndTimeMs: overrides.demandEndTimeMs ?? lastRelease,
    completionDeadlineMs: overrides.completionDeadlineMs ?? lastRelease + 60 * MINUTE,
    vehicles: vehicles.map((vehicle) => ({
      id: vehicle.id,
      nodeId: vehicle.node,
      capacity: vehicle.capacity ?? 4,
    })),
    requests: requests.map((request) => ({
      id: request.id,
      requestTimeMs: request.at,
      originNodeId: request.from,
      destinationNodeId: request.to,
      passengers: 1,
    })),
  };
};

export const chooseAction = (observation: Observation, candidateId: string): Action => ({
  kind: "chooseCandidate",
  schemaVersion: ACTION_SCHEMA_VERSION,
  stateVersion: observation.stateVersion,
  candidateId,
});

/** A policy driven by a function of the observation; records every observation it saw. */
export const functionPolicy = (
  choose: (observation: Observation) => Action,
): Policy & { readonly seen: Observation[] } => {
  const seen: Observation[] = [];
  return {
    seen,
    descriptor: { id: "test-function", kind: "fixture" },
    decide: (observation) => {
      seen.push(observation);
      return Promise.resolve({ action: choose(observation) });
    },
  };
};

/** Always picks the first candidate in host order. */
export const firstCandidatePolicy = (): Policy & { readonly seen: Observation[] } =>
  functionPolicy((observation) =>
    chooseAction(observation, observation.candidates[0]?.id ?? "none"),
  );
