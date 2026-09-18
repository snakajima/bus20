import { digestDocument } from "@bus20/contracts/digest";
import { parseJsonWithSchema } from "@bus20/contracts/json";
import { type Manifest, validateManifest } from "@bus20/contracts/manifest";
import { type MapDocument, validateMapDocument } from "@bus20/contracts/map";
import { fail, issue, type Issue, ok, type Result } from "@bus20/contracts/result";
import { type ScenarioDocument, validateScenarioDocument } from "@bus20/contracts/scenario";
import { checkScenarioOnMap } from "@bus20/graph/scenario-check";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { type BuiltSuite } from "./build-suite.js";

const JSON_INDENT = 2;

export const writeJsonAtomic = async (filePath: string, value: unknown): Promise<void> => {
  await mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tempPath, `${JSON.stringify(value, null, JSON_INDENT)}\n`, "utf8");
  await rename(tempPath, filePath);
};

export const MANIFEST_FILE = "manifest.json";

/** Writes maps, scenarios, and the manifest under `rootDir`. Returns the manifest path. */
export const writeSuite = async (rootDir: string, suite: BuiltSuite): Promise<string> => {
  for (const map of suite.maps) {
    await writeJsonAtomic(path.join(rootDir, map.entry.path), map.document);
  }
  for (const scenario of suite.scenarios) {
    await writeJsonAtomic(path.join(rootDir, scenario.entry.path), scenario.document);
  }
  const manifestPath = path.join(rootDir, MANIFEST_FILE);
  await writeJsonAtomic(manifestPath, suite.manifest);
  return manifestPath;
};

const readValidated = async <T>(
  filePath: string,
  validate: (value: unknown) => Result<T>,
): Promise<Result<T>> => {
  try {
    const parsed = parseJsonWithSchema(z.unknown(), await readFile(filePath, "utf8"));
    return parsed.ok ? validate(parsed.value) : parsed;
  } catch (error: unknown) {
    return fail([issue(filePath, error instanceof Error ? error.message : String(error))]);
  }
};

export const readManifest = (manifestPath: string): Promise<Result<Manifest>> =>
  readValidated(manifestPath, validateManifest);

export interface LoadedSuite {
  readonly manifest: Manifest;
  readonly manifestDir: string;
  readonly maps: ReadonlyMap<string, MapDocument>;
  readonly scenarios: ReadonlyMap<string, ScenarioDocument>;
}

const checkDigest = (label: string, expected: string, document: unknown): Issue[] => {
  const actual = digestDocument(document);
  return actual === expected
    ? []
    : [issue(label, `digest ${actual} does not match manifest ${expected}`)];
};

const loadMaps = async (manifest: Manifest, dir: string) => {
  const issues: Issue[] = [];
  const maps = new Map<string, MapDocument>();
  for (const entry of manifest.maps) {
    const loaded = await readValidated(path.join(dir, entry.path), validateMapDocument);
    if (!loaded.ok) {
      issues.push(...loaded.issues);
      continue;
    }
    issues.push(...checkDigest(entry.path, entry.digest, loaded.value));
    maps.set(entry.id, loaded.value);
  }
  return { maps, issues };
};

const crossCheck = (
  label: string,
  scenario: ScenarioDocument,
  map: MapDocument | undefined,
): Issue[] =>
  map === undefined
    ? []
    : checkScenarioOnMap(scenario, map).map((item) => issue(`${label}:${item.path}`, item.message));

const loadScenarios = async (
  manifest: Manifest,
  dir: string,
  maps: ReadonlyMap<string, MapDocument>,
) => {
  const issues: Issue[] = [];
  const scenarios = new Map<string, ScenarioDocument>();
  for (const entry of manifest.scenarios) {
    const loaded = await readValidated(path.join(dir, entry.path), validateScenarioDocument);
    if (!loaded.ok) {
      issues.push(...loaded.issues);
      continue;
    }
    issues.push(...checkDigest(entry.path, entry.digest, loaded.value));
    issues.push(...crossCheck(entry.path, loaded.value, maps.get(entry.mapId)));
    scenarios.set(entry.id, loaded.value);
  }
  return { scenarios, issues };
};

/**
 * Loads and fully verifies a suite: schema, semantic checks, digests against
 * the manifest, and scenario-on-map consistency. Any issue fails the load.
 */
export const loadSuite = async (manifestPath: string): Promise<Result<LoadedSuite>> => {
  const manifest = await readManifest(manifestPath);
  if (!manifest.ok) {
    return manifest;
  }
  const manifestDir = path.dirname(manifestPath);
  const maps = await loadMaps(manifest.value, manifestDir);
  const scenarios = await loadScenarios(manifest.value, manifestDir, maps.maps);
  const issues = [...maps.issues, ...scenarios.issues];
  return issues.length === 0
    ? ok({ manifest: manifest.value, manifestDir, maps: maps.maps, scenarios: scenarios.scenarios })
    : fail(issues);
};
