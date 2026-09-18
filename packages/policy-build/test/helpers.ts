import { buildSuite } from "@bus20/datasets/build-suite";
import { type LoadedSuite, loadSuite, writeSuite } from "@bus20/datasets/files";
import { suiteConfigSchema } from "@bus20/datasets/suite-config";
import { silentLogger } from "@bus20/runner/logging";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  type GenerationInput,
  type GenerationOutput,
  type ProgramGenerator,
} from "../src/generator.js";

// Tests run from dist/test, four levels below the repository root.
const REPO_ROOT = path.resolve(import.meta.dirname, "../../../..");

export const tempDir = (): string => mkdtempSync(path.join(tmpdir(), "bus20-campaign-"));

/** A tiny two-city suite so a full campaign runs in seconds. */
export const smallSuite = async (): Promise<LoadedSuite> => {
  const config = suiteConfigSchema.parse({
    benchmarkVersion: "campaign-test/1",
    seed: 11,
    cities: [
      {
        id: "a",
        name: "A",
        width: 5,
        height: 5,
        blockMeters: 120,
        removeFraction: 0.1,
        oneWayFraction: 0.3,
        speedsMps: [9],
        originLat: 35,
        originLon: 139,
      },
    ],
    loads: { low: { targetUtilization: 0.3 } },
    patterns: ["uniform", "commute"],
    splits: { dev: 2, validation: 1, test: 1 },
    fleet: { vehicleCount: 2, capacity: 4 },
    timing: { demandMinutes: 20, deadlineMarginMinutes: 20 },
  });
  const dir = tempDir();
  const manifestPath = await writeSuite(dir, buildSuite(config, "2026-01-01T00:00:00Z"));
  const loaded = await loadSuite(manifestPath);
  if (!loaded.ok) {
    throw new Error("small suite failed to load");
  }
  return loaded.value;
};

export const SAMPLE_SOURCE = readFileSync(
  path.join(REPO_ROOT, "packages/policy-runtime/test/fixtures/append-earliest.ts.txt"),
  "utf8",
);

export const FIRST_CANDIDATE_SOURCE = `function decide(o: any) {
  return { kind: "chooseCandidate", schemaVersion: "bus20-action/1", stateVersion: o.stateVersion, candidateId: o.candidates[0].id };
}`;

export const LAST_CANDIDATE_SOURCE = `function decide(o: any) {
  const c = o.candidates[o.candidates.length - 1];
  return { kind: "chooseCandidate", schemaVersion: "bus20-action/1", stateVersion: o.stateVersion, candidateId: c.id };
}`;

export const BROKEN_SOURCE = `import fs from "node:fs"; function decide() {}`;

/** Replays a fixed list of sources and records what it was asked. */
export const scriptedGenerator = (
  sources: readonly string[],
): ProgramGenerator & { readonly inputs: GenerationInput[] } => {
  const inputs: GenerationInput[] = [];
  return {
    inputs,
    generate: (input): Promise<GenerationOutput> => {
      inputs.push(input);
      const source = sources[inputs.length - 1];
      if (source === undefined) {
        return Promise.reject(new Error("script exhausted"));
      }
      return Promise.resolve({
        source,
        language: "typescript",
        provider: "test",
        modelId: "scripted",
        promptVersion: "test/1",
        spend: { inputTokens: 100, outputTokens: 50, costUsd: 0.01, wallMs: 1 },
        trace: { attempt: input.attempt },
      });
    },
  };
};

export const logger = silentLogger;
