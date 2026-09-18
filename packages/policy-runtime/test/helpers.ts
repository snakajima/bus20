import { digestDocument } from "@bus20/contracts/digest";
import { type MapDocument, validateMapDocument } from "@bus20/contracts/map";
import { type PolicyProgram } from "@bus20/contracts/policy-artifact";
import { type ScenarioDocument, validateScenarioDocument } from "@bus20/contracts/scenario";
import { readFileSync } from "node:fs";
import path from "node:path";
import { compileProgram } from "../src/compile.js";

// Tests run from dist/test, four levels below the repository root.
const REPO_ROOT = path.resolve(import.meta.dirname, "../../../..");
const FIXTURES = path.join(REPO_ROOT, "datasets/fixtures");

const readJson = (relative: string): unknown =>
  JSON.parse(readFileSync(path.join(FIXTURES, relative), "utf8"));

export const loadFixture = (): { scenario: ScenarioDocument; map: MapDocument } => {
  const map = validateMapDocument(readJson("maps/grid3x3/v1/map.json"));
  const scenario = validateScenarioDocument(readJson("scenarios/smoke/smoke-01.json"));
  if (!map.ok || !scenario.ok) {
    throw new Error("fixture is invalid");
  }
  return { scenario: scenario.value, map: map.value };
};

export const SAMPLE_SOURCE = readFileSync(
  path.join(REPO_ROOT, "packages/policy-runtime/test/fixtures/append-earliest.ts.txt"),
  "utf8",
);

/** Wraps a source string into a frozen program record for tests. */
export const programFrom = (
  source: string,
  language: "typescript" | "javascript" = "typescript",
): PolicyProgram => {
  const compiled = compileProgram(source, language);
  if (!compiled.ok) {
    throw new Error(compiled.issues.map((issue) => issue.message).join("; "));
  }
  return {
    schemaVersion: "bus20-policy-program/1",
    id: "test-program",
    campaignId: "test",
    version: 0,
    parentId: null,
    origin: "initial",
    language,
    source,
    compiled: compiled.value,
    compileError: null,
    sourceDigest: digestDocument(source),
    generator: { provider: "test", modelId: "none", promptVersion: "test" },
    spend: { inputTokens: 0, outputTokens: 0, costUsd: null, wallMs: 0 },
  };
};
