import { digestDocument } from "@bus20/contracts/digest";
import { validateManifest } from "@bus20/contracts/manifest";
import { validateMapDocument } from "@bus20/contracts/map";
import { validateScenarioDocument } from "@bus20/contracts/scenario";
import { checkScenarioOnMap } from "@bus20/graph/scenario-check";
import { buildGraph } from "@bus20/graph/graph";
import { reachableFrom } from "@bus20/graph/shortest-path";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { buildSuite } from "../src/build-suite.js";
import { loadSuite, writeSuite } from "../src/files.js";
import { type SuiteConfig, suiteConfigSchema } from "../src/suite-config.js";

// Tests run from dist/test, four levels below the repository root.
const REPO_ROOT = path.resolve(import.meta.dirname, "../../../..");

const smallConfig = (): SuiteConfig =>
  suiteConfigSchema.parse({
    benchmarkVersion: "test/1",
    seed: 7,
    cities: [
      {
        id: "alpha",
        name: "Alpha",
        width: 6,
        height: 6,
        blockMeters: 120,
        removeFraction: 0.1,
        oneWayFraction: 0.4,
        speedsMps: [8, 10],
        originLat: 35,
        originLon: 139,
      },
      {
        id: "beta",
        name: "Beta",
        width: 5,
        height: 7,
        blockMeters: 150,
        removeFraction: 0.05,
        oneWayFraction: 0.2,
        speedsMps: [9],
        originLat: 40,
        originLon: -74,
      },
    ],
    loads: { low: { targetUtilization: 0.2 }, high: { targetUtilization: 0.6 } },
    patterns: ["uniform", "commute", "hotspot"],
    splits: { dev: 3, test: 1 },
    fleet: { vehicleCount: 3, capacity: 4 },
    timing: { demandMinutes: 30, deadlineMarginMinutes: 60 },
  });

test("suite generation is deterministic and every document validates", () => {
  const first = buildSuite(smallConfig(), "2026-01-01T00:00:00Z");
  const second = buildSuite(smallConfig(), "2026-01-01T00:00:00Z");
  assert.deepEqual(first.manifest, second.manifest);
  assert.equal(first.scenarios.length, 2 * 2 * 4);
  assert.equal(validateManifest(first.manifest).ok, true);
  for (const map of first.maps) {
    assert.equal(validateMapDocument(map.document).ok, true);
    assert.equal(map.entry.digest, digestDocument(map.document));
    const graph = buildGraph(map.document);
    const [node] = map.document.nodes;
    assert.ok(node !== undefined);
    assert.equal(reachableFrom(graph, node.id).size, map.document.nodes.length);
  }
  for (const scenario of first.scenarios) {
    assert.equal(validateScenarioDocument(scenario.document).ok, true);
    const map = first.maps.find((item) => item.entry.id === scenario.entry.mapId);
    assert.ok(map !== undefined);
    assert.deepEqual(checkScenarioOnMap(scenario.document, map.document), []);
    assert.equal(scenario.entry.digest, digestDocument(scenario.document));
  }
});

test("request counts are equal within a (city, load) cell and grow with load", () => {
  const suite = buildSuite(smallConfig(), "2026-01-01T00:00:00Z");
  const counts = new Map<string, Set<number>>();
  for (const scenario of suite.scenarios) {
    const key = `${scenario.entry.city}/${scenario.entry.load}`;
    counts.set(key, new Set([...(counts.get(key) ?? []), scenario.entry.requestCount]));
  }
  for (const [key, set] of counts) {
    assert.equal(set.size, 1, `${key} has ${[...set].join(",")}`);
  }
  const alphaLow = [...(counts.get("alpha/low") ?? [])][0] ?? 0;
  const alphaHigh = [...(counts.get("alpha/high") ?? [])][0] ?? 0;
  assert.ok(alphaHigh > alphaLow);
});

test("patterns shape demand: commute peaks early toward the centre, hotspot bursts", () => {
  const suite = buildSuite(smallConfig(), "2026-01-01T00:00:00Z");
  const byPattern = (pattern: string) =>
    suite.scenarios.filter(
      (scenario) => scenario.entry.pattern === pattern && scenario.entry.load === "high",
    );
  const firstHalfShare = (requests: readonly { requestTimeMs: number }[], endMs: number): number =>
    requests.filter((request) => request.requestTimeMs <= endMs / 2).length / requests.length;
  for (const scenario of byPattern("commute")) {
    const share = firstHalfShare(scenario.document.requests, scenario.document.demandEndTimeMs);
    assert.ok(share > 0.7, `commute first-half share ${share}`);
  }
  for (const scenario of byPattern("hotspot")) {
    const end = scenario.document.demandEndTimeMs;
    const burst = scenario.document.requests.filter(
      (request) => request.requestTimeMs >= end * 0.4 && request.requestTimeMs <= end * 0.55,
    ).length;
    assert.ok(burst / scenario.document.requests.length > 0.4, `hotspot burst share ${burst}`);
  }
  for (const scenario of byPattern("uniform")) {
    const share = firstHalfShare(scenario.document.requests, scenario.document.demandEndTimeMs);
    assert.ok(share > 0.3 && share < 0.7, `uniform first-half share ${share}`);
  }
});

test("request ids are release-ordered and origins differ from destinations", () => {
  const suite = buildSuite(smallConfig(), "2026-01-01T00:00:00Z");
  for (const scenario of suite.scenarios) {
    const { requests } = scenario.document;
    for (const [index, request] of requests.entries()) {
      const previous = requests[index - 1];
      if (previous !== undefined) {
        assert.ok(previous.requestTimeMs <= request.requestTimeMs);
        assert.ok(previous.id < request.id);
      }
      assert.notEqual(request.originNodeId, request.destinationNodeId);
    }
  }
});

test("written suites load and verify; a tampered scenario is rejected", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "bus20-suite-"));
  const suite = buildSuite(smallConfig(), "2026-01-01T00:00:00Z");
  const manifestPath = await writeSuite(dir, suite);
  const loaded = await loadSuite(manifestPath);
  assert.ok(loaded.ok);
  assert.equal(loaded.value.scenarios.size, suite.scenarios.length);
  const [entry] = suite.manifest.scenarios;
  assert.ok(entry !== undefined);
  const scenarioPath = path.join(dir, entry.path);
  const text = readFileSync(scenarioPath, "utf8");
  writeFileSync(scenarioPath, text.replace('"requestTimeMs": ', '"requestTimeMs": 1'));
  const tampered = await loadSuite(manifestPath);
  assert.equal(tampered.ok, false);
  assert.match(tampered.issues.map((issue) => issue.message).join("\n"), /digest/);
});

test("the committed synthetic-dev suite matches its config and manifest", async () => {
  const configPath = path.join(REPO_ROOT, "datasets/configs/synthetic-dev-1.json");
  const config = suiteConfigSchema.parse(JSON.parse(readFileSync(configPath, "utf8")));
  const manifestPath = path.join(REPO_ROOT, "datasets/synthetic-dev-1/manifest.json");
  const loaded = await loadSuite(manifestPath);
  assert.ok(loaded.ok);
  const rebuilt = buildSuite(config, loaded.value.manifest.createdAt);
  assert.deepEqual(rebuilt.manifest, loaded.value.manifest);
});

test("the committed second-paper suite matches its config and uses a different seed", async () => {
  const configPath = path.join(REPO_ROOT, "datasets/configs/synthetic-paper2-1.json");
  const config = suiteConfigSchema.parse(JSON.parse(readFileSync(configPath, "utf8")));
  const devConfig = suiteConfigSchema.parse(
    JSON.parse(readFileSync(path.join(REPO_ROOT, "datasets/configs/synthetic-dev-1.json"), "utf8")),
  );
  assert.notEqual(config.seed, devConfig.seed);
  const loaded = await loadSuite(path.join(REPO_ROOT, "datasets/synthetic-paper2-1/manifest.json"));
  assert.ok(loaded.ok);
  assert.deepEqual(
    buildSuite(config, loaded.value.manifest.createdAt).manifest,
    loaded.value.manifest,
  );
  const devLoaded = await loadSuite(path.join(REPO_ROOT, "datasets/synthetic-dev-1/manifest.json"));
  assert.ok(devLoaded.ok);
  const devDigests = new Set(devLoaded.value.manifest.scenarios.map((scenario) => scenario.digest));
  assert.ok(loaded.value.manifest.scenarios.every((scenario) => !devDigests.has(scenario.digest)));
});
