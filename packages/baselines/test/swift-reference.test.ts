import { type MapDocument, validateMapDocument } from "@bus20/contracts/map";
import { type ScenarioDocument, validateScenarioDocument } from "@bus20/contracts/scenario";
import { runSimulation } from "@bus20/simulator/run";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { createSwiftReferencePolicy } from "../src/swift-reference.js";
import { allCosts, createIndependentPolicy } from "./independent-rule.js";

// Tests run from dist/test, four levels below the repository root.
const REPO_ROOT = path.resolve(import.meta.dirname, "../../../..");
const FIXTURES = path.join(REPO_ROOT, "datasets/fixtures");
const SWIFT_CLI =
  process.env["BUS20_SWIFT_CLI"] ??
  ["release", "debug"]
    .map((config) => path.join(REPO_ROOT, "swift/.build", config, "bus20-baseline"))
    .find((candidate) => existsSync(candidate));

const readJson = (relative: string): unknown =>
  JSON.parse(readFileSync(path.join(FIXTURES, relative), "utf8"));

const loadFixture = (): { scenario: ScenarioDocument; map: MapDocument } => {
  const map = validateMapDocument(readJson("maps/grid3x3/v1/map.json"));
  const scenario = validateScenarioDocument(readJson("scenarios/smoke/smoke-01.json"));
  if (!map.ok || !scenario.ok) {
    throw new Error("fixture is invalid");
  }
  return { scenario: scenario.value, map: map.value };
};

const requireCli = (): string => {
  if (SWIFT_CLI === undefined) {
    throw new Error("Swift CLI not built: run `yarn build:swift` (or set BUS20_SWIFT_CLI)");
  }
  return SWIFT_CLI;
};

test("Swift reference agrees with the independent rule on every smoke decision", async () => {
  const { scenario, map } = loadFixture();
  const swift = createSwiftReferencePolicy({ command: requireCli() });
  try {
    const swiftLog = await runSimulation(scenario, map, swift);
    const independent = createIndependentPolicy();
    const independentLog = await runSimulation(scenario, map, independent);
    assert.equal(swiftLog.termination.kind, "drained");
    assert.equal(swiftLog.policy.kind, "swift-reference");
    assert.deepEqual(
      swiftLog.decisions.map((decision) => decision.action),
      independentLog.decisions.map((decision) => decision.action),
    );
    assert.deepEqual(
      swiftLog.decisions.map((decision) => decision.usage?.["swiftIncrementalCostMs2"]),
      independent.verdicts.map((verdict) => verdict.incrementalCostMs2),
    );
    assert.deepEqual(swiftLog.journeys, independentLog.journeys);
    assert.equal(swiftLog.decisions.length, 12);
  } finally {
    swift.close();
  }
});

test("Swift choice is the exhaustive minimum over all candidates at each decision", async () => {
  const { scenario, map } = loadFixture();
  const swift = createSwiftReferencePolicy({ command: requireCli() });
  const observed: Parameters<typeof allCosts>[0][] = [];
  const recording = {
    descriptor: swift.descriptor,
    decide: (observation: Parameters<typeof allCosts>[0]) => {
      observed.push(observation);
      return swift.decide(observation);
    },
  };
  try {
    const log = await runSimulation(scenario, map, recording);
    log.decisions.forEach((decision, index) => {
      const observation = observed[index];
      assert.ok(observation !== undefined);
      const costs = allCosts(observation);
      const minimum = Math.min(...costs.map((item) => item.incrementalCostMs2));
      const firstMinimum = costs.find((item) => item.incrementalCostMs2 === minimum);
      assert.equal(decision.action.kind, "chooseCandidate");
      assert.equal(decision.action.candidateId, firstMinimum?.candidateId);
      assert.equal(decision.usage?.["candidatesEvaluated"], observation.candidates.length);
    });
  } finally {
    swift.close();
  }
});

test("Swift reference completes the smoke scenario with every decision accepted", async () => {
  const { scenario, map } = loadFixture();
  const swift = createSwiftReferencePolicy({ command: requireCli() });
  try {
    const log = await runSimulation(scenario, map, swift);
    assert.equal(log.journeys.length, scenario.requests.length);
    assert.ok(log.decisions.every((decision) => decision.outcome.status === "accepted"));
  } finally {
    swift.close();
  }
});
