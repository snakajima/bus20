import assert from "node:assert/strict";
import { test } from "node:test";
import { createFixturePolicy } from "../src/fixture-policy.js";
import { createReplayPolicy, verifyReplay } from "../src/replay.js";
import { runSimulation } from "../src/run.js";
import { loadGridMap, loadSmokeScenario } from "./helpers.js";

test("replaying a log reproduces journeys, termination, and the state digest", async () => {
  const scenario = loadSmokeScenario();
  const map = loadGridMap();
  const log = await runSimulation(scenario, map, createFixturePolicy());
  const verdict = await verifyReplay(scenario, map, log);
  assert.deepEqual(verdict.differences, []);
  assert.equal(verdict.matches, true);
  assert.equal(verdict.replayed.finalStateDigest, log.finalStateDigest);
});

test("a tampered log is detected on replay", async () => {
  const scenario = loadSmokeScenario();
  const map = loadGridMap();
  const log = await runSimulation(scenario, map, createFixturePolicy());
  const [first, ...rest] = log.journeys;
  if (first === undefined) {
    throw new Error("expected journeys");
  }
  const tampered = {
    ...log,
    journeys: [{ ...first, dropoffTimeMs: first.dropoffTimeMs + 1 }, ...rest],
  };
  const verdict = await verifyReplay(scenario, map, tampered);
  assert.deepEqual(verdict.differences, ["journeys differs"]);
});

test("replay against a different scenario stops at the first mismatching decision", async () => {
  const scenario = loadSmokeScenario();
  const map = loadGridMap();
  const log = await runSimulation(scenario, map, createFixturePolicy());
  const reordered = { ...log, decisions: [...log.decisions].reverse() };
  const replayed = await runSimulation(scenario, map, createReplayPolicy(reordered));
  assert.equal(
    replayed.termination.kind === "failed" ? replayed.termination.reason : "",
    "policyError",
  );
  assert.match(
    replayed.termination.kind === "failed" ? replayed.termination.detail : "",
    /replay mismatch at decision 1/,
  );
});
