import { type MapDocument, validateMapDocument } from "@bus20/contracts/map";
import { type ScenarioDocument, validateScenarioDocument } from "@bus20/contracts/scenario";
import { readFileSync } from "node:fs";
import path from "node:path";

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

/** Small hand-built map. Edge travel times in ms. */
export const makeMap = (
  edges: readonly (readonly [id: string, from: string, to: string, travelTimeMs: number])[],
  stopDenied: readonly string[] = [],
): MapDocument => {
  const nodeIds = new Set(edges.flatMap(([, from, to]) => [from, to]));
  return {
    schemaVersion: "bus20-map/1",
    id: "test-map",
    nodes: [...nodeIds].map((id) => ({ id, stopAllowed: !stopDenied.includes(id) })),
    edges: edges.map(([id, from, to, travelTimeMs]) => ({ id, from, to, travelTimeMs })),
  };
};
