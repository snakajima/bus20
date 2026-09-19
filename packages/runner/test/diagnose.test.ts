import { runSimulation } from "@bus20/simulator/run";
import { createFixturePolicy } from "@bus20/simulator/fixture-policy";
import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { diagnoseRun } from "../src/diagnose.js";
import { createPolicyById, loadInputs } from "../src/run-scenario.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../../..");
const SCENARIO = path.join(REPO_ROOT, "datasets/fixtures/scenarios/smoke/smoke-01.json");
const MAP = path.join(REPO_ROOT, "datasets/fixtures/maps/grid3x3/v1/map.json");

test("replay diagnosis scores the rule as always best and the fixture policy with regret", async () => {
  const inputs = await loadInputs(SCENARIO, MAP);
  assert.ok(inputs.ok);
  const rule = createPolicyById("rollout", {
    inputs: inputs.value,
    rollout: { demand: "empirical", samples: 0 },
  });
  assert.ok(rule !== undefined);
  const ruleLog = await runSimulation(inputs.value.scenario, inputs.value.map, rule.policy);
  const key = { load: "low", repetition: 0 };
  const ruleRecords = await diagnoseRun(inputs.value, ruleLog, key);
  assert.equal(ruleRecords.length, 12);
  assert.ok(ruleRecords.every((r) => r.rank === 0 && r.regretMs2 === 0));
  assert.ok(ruleRecords.every((r) => r.load === "low" && r.policyId === ruleLog.policy.id));

  const fixtureLog = await runSimulation(
    inputs.value.scenario,
    inputs.value.map,
    createFixturePolicy(),
  );
  const fixtureRecords = await diagnoseRun(inputs.value, fixtureLog, key);
  assert.equal(fixtureRecords.length, 12);
  assert.ok(
    fixtureRecords.some((r) => r.regretMs2 > 0),
    "append-earliest-pickup is not the rule",
  );
  assert.ok(fixtureRecords.every((r) => r.rank < r.candidates));
  assert.ok(fixtureRecords.every((r) => r.chosen.waitMinutes >= 0 && r.best.waitMinutes >= 0));
});
