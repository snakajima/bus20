import { readFileSync } from "node:fs";
import path from "node:path";
import { parseJsonWithSchema } from "../src/json.js";
import { type MapDocument, mapDocumentSchema } from "../src/map.js";
import { type ScenarioDocument, scenarioDocumentSchema } from "../src/scenario.js";

// Tests run from dist/test, four levels below the repository root.
const FIXTURE_ROOT = path.resolve(import.meta.dirname, "../../../../datasets/fixtures");
export const GRID_MAP_PATH = path.join(FIXTURE_ROOT, "maps/grid3x3/v1/map.json");
export const SMOKE_SCENARIO_PATH = path.join(FIXTURE_ROOT, "scenarios/smoke/smoke-01.json");

const mustParse = <T>(label: string, result: { ok: true; value: T } | { ok: false }): T => {
  if (!result.ok) {
    throw new Error(`fixture ${label} failed to parse`);
  }
  return result.value;
};

export const loadGridMap = (): MapDocument =>
  mustParse("map", parseJsonWithSchema(mapDocumentSchema, readFileSync(GRID_MAP_PATH, "utf8")));

export const loadSmokeScenario = (): ScenarioDocument =>
  mustParse(
    "scenario",
    parseJsonWithSchema(scenarioDocumentSchema, readFileSync(SMOKE_SCENARIO_PATH, "utf8")),
  );

/** Deep JSON clone for building invalid variants of a fixture. */
export const cloneJson = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

const isJsonObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Clones a fixture and applies a mutation so tests can build invalid variants. */
export const mutatedClone = (
  source: unknown,
  mutate: (doc: Record<string, unknown>) => void,
): unknown => {
  const doc = cloneJson(source);
  if (!isJsonObject(doc)) {
    throw new Error("fixture is not a JSON object");
  }
  mutate(doc);
  return doc;
};

export const asArray = (value: unknown): unknown[] => {
  if (!Array.isArray(value)) {
    throw new Error("expected an array");
  }
  return value;
};

export const asObject = (value: unknown): Record<string, unknown> => {
  if (!isJsonObject(value)) {
    throw new Error("expected an object");
  }
  return value;
};
