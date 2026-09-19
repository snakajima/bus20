import { createForecastPresentation } from "@bus20/models/forecast-presentation";
import { runSimulation } from "@bus20/simulator/run";
import assert from "node:assert/strict";
import { test } from "node:test";
import { loadSuite } from "@bus20/datasets/files";
import path from "node:path";
import { createKnownForecaster } from "../src/forecast.js";
import { createPolicyById, loadInputs } from "../src/run-scenario.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../../..");
const MANIFEST = path.join(REPO_ROOT, "datasets/synthetic-dev-2/manifest.json");
const SMOKE_SCENARIO = path.join(REPO_ROOT, "datasets/fixtures/scenarios/smoke/smoke-01.json");
const SMOKE_MAP = path.join(REPO_ROOT, "datasets/fixtures/maps/grid3x3/v1/map.json");

test("the forecast presentation adds expected demand to the state and to every option", async () => {
  const suite = await loadSuite(MANIFEST);
  assert.ok(suite.ok);
  const entry = suite.value.manifest.scenarios.find((s) => s.id === "nyc-like-medium-dev-01");
  const scenario = entry === undefined ? undefined : suite.value.scenarios.get(entry.id);
  const map = entry === undefined ? undefined : suite.value.maps.get(entry.mapId);
  assert.ok(scenario !== undefined && map !== undefined);
  const forecaster = createKnownForecaster(map, scenario);
  assert.ok(forecaster !== undefined);
  const presentation = createForecastPresentation(forecaster);
  assert.equal(presentation.promptVersion, "bus20-prompt/5");
  const seen: string[] = [];
  const probe = {
    descriptor: { id: "probe", kind: "fixture" as const },
    decide: (o: Parameters<typeof presentation.state>[0]) => {
      const state = presentation.state(o);
      const expected = state["expected_new_requests_next_10_minutes"];
      assert.ok(typeof expected === "number" && expected > 0);
      const [candidate] = o.candidates;
      assert.ok(candidate !== undefined);
      const option = presentation.candidateOption(o, candidate).description;
      assert.ok(typeof option["vehicle_free_in_minutes"] === "number");
      assert.ok(typeof option["expected_nearby_requests_after"] === "number");
      const what = option["what"];
      assert.ok(typeof what === "string");
      assert.match(what, /free in \d+ minutes with about [\d.]+ new requests/);
      seen.push(what);
      return Promise.resolve({
        action: {
          schemaVersion: "bus20-action/1" as const,
          kind: "chooseCandidate" as const,
          stateVersion: o.stateVersion,
          candidateId: candidate.id,
        },
      });
    },
  };
  const log = await runSimulation(scenario, map, probe, { maxDecisions: 5 });
  assert.equal(log.decisions.length, 5);
  assert.equal(seen.length, 5);
  // Forecasts are seeded by the decision, so the same observation yields the same numbers.
  const again = await runSimulation(scenario, map, probe, { maxDecisions: 5 });
  assert.equal(again.decisions.length, 5);
  assert.deepEqual(seen.slice(5), seen.slice(0, 5));
});

test("the forecast presentation needs generator provenance", async () => {
  const inputs = await loadInputs(SMOKE_SCENARIO, SMOKE_MAP);
  assert.ok(inputs.ok);
  process.env["TYPESAFE_API_KEY"] = "test";
  assert.throws(
    () => createPolicyById("jev", { inputs: inputs.value, presentation: "forecast" }),
    /generator provenance/,
  );
});
