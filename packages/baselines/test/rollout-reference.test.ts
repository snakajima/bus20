import { type MapDocument, validateMapDocument } from "@bus20/contracts/map";
import { type Observation } from "@bus20/contracts/observation";
import { createRng } from "@bus20/contracts/random";
import { type ScenarioDocument, validateScenarioDocument } from "@bus20/contracts/scenario";
import { MS_PER_MINUTE } from "@bus20/contracts/time";
import { OBSERVATION_SCHEMA_VERSION } from "@bus20/contracts/versions";
import { verifyReplay } from "@bus20/simulator/replay";
import { Routing } from "@bus20/simulator/routing";
import { runSimulation } from "@bus20/simulator/run";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { DemandHistory } from "../src/demand-history.js";
import { incrementalCosts, shortlistByCost } from "../src/insertion-rule.js";
import { createRandomShortlistPolicy } from "../src/random-shortlist.js";
import { createRolloutReferencePolicy } from "../src/rollout-reference.js";
import {
  advanceWorld,
  insertGreedily,
  totalCostMs2,
  type World,
  worldFromObservation,
} from "../src/rollout-world.js";
import { allCosts, createIndependentPolicy } from "./independent-rule.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../../..");
const FIXTURES = path.join(REPO_ROOT, "datasets/fixtures");

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

const MINUTE = MS_PER_MINUTE;

/** One vehicle idle at n00 at t=0 with r1 (n00 -> n02) already assigned; r2 (n20 -> n22) deciding. */
const observation = (): Observation => ({
  schemaVersion: OBSERVATION_SCHEMA_VERSION,
  scenarioId: "unit",
  stateVersion: 3,
  nowMs: 0,
  decisionRequestId: "r2",
  vehicles: [
    {
      id: "v1",
      capacity: 4,
      position: { kind: "atNode", nodeId: "n00" },
      onboardRequestIds: [],
      stops: [
        { requestId: "r1", kind: "pickup", nodeId: "n00", plannedArrivalTimeMs: 0 },
        { requestId: "r1", kind: "dropoff", nodeId: "n02", plannedArrivalTimeMs: 2 * MINUTE },
      ],
    },
  ],
  requests: [
    {
      id: "r1",
      requestTimeMs: 0,
      originNodeId: "n00",
      destinationNodeId: "n02",
      phase: "assigned",
      directTravelTimeMs: 2 * MINUTE,
    },
    {
      id: "r2",
      requestTimeMs: 0,
      originNodeId: "n20",
      destinationNodeId: "n22",
      phase: "waiting",
      directTravelTimeMs: 2 * MINUTE,
    },
  ],
  candidates: [
    {
      id: "v1:2:3",
      vehicleId: "v1",
      stops: [
        { requestId: "r1", kind: "pickup", nodeId: "n00", plannedArrivalTimeMs: 0 },
        { requestId: "r1", kind: "dropoff", nodeId: "n02", plannedArrivalTimeMs: 2 * MINUTE },
        { requestId: "r2", kind: "pickup", nodeId: "n20", plannedArrivalTimeMs: 6 * MINUTE },
        { requestId: "r2", kind: "dropoff", nodeId: "n22", plannedArrivalTimeMs: 8 * MINUTE },
      ],
    },
    {
      id: "v1:0:1",
      vehicleId: "v1",
      stops: [
        { requestId: "r2", kind: "pickup", nodeId: "n20", plannedArrivalTimeMs: 2 * MINUTE },
        { requestId: "r2", kind: "dropoff", nodeId: "n22", plannedArrivalTimeMs: 4 * MINUTE },
        { requestId: "r1", kind: "pickup", nodeId: "n00", plannedArrivalTimeMs: 8 * MINUTE },
        { requestId: "r1", kind: "dropoff", nodeId: "n02", plannedArrivalTimeMs: 10 * MINUTE },
      ],
    },
  ],
});

test("insertion rule costs agree with the independent statement and shortlist keeps host order on ties", () => {
  const o = observation();
  const costs = incrementalCosts(o).map((item) => item.incrementalCostMs2);
  assert.deepEqual(
    costs,
    allCosts(o).map((item) => item.incrementalCostMs2),
  );
  // Appending r2 delays it by 6 minutes; serving it first delays r1 by 8 and r2 by 2.
  assert.deepEqual(costs, [(6 * MINUTE) ** 2, (8 * MINUTE) ** 2 + (2 * MINUTE) ** 2]);
  assert.deepEqual(
    shortlistByCost(o, 1).map((item) => item.candidate.id),
    ["v1:2:3"],
  );
  assert.equal(shortlistByCost(o, 10).length, 2);
});

test("the rollout world serves due stops, finishes the current edge, and inserts greedily", () => {
  const { map } = loadFixture();
  const routing = new Routing(map);
  const o = observation();
  const [append] = o.candidates;
  assert.ok(append !== undefined);
  const world: World = worldFromObservation(o, append);
  advanceWorld(routing, world, 3 * MINUTE);
  const [v1] = world.vehicles;
  assert.ok(v1 !== undefined);
  assert.equal(world.served.get("r1"), 2 * MINUTE);
  assert.deepEqual(v1.onboard, []);
  // Times are recomputed from the map, not taken from the observation.
  const leg = (from: string, to: string): number => routing.travelTimeMs(from, to) ?? NaN;
  const atPickup = 2 * MINUTE + leg("n02", "n20");
  const edge = routing.firstEdge("n02", "n20");
  assert.ok(edge !== undefined);
  assert.deepEqual(
    v1.free,
    { nodeId: edge.to, timeMs: 2 * MINUTE + edge.travelTimeMs },
    "finishes the edge it is on, then may re-plan",
  );
  assert.equal(v1.stops.length, 2);
  // A new trip n20 -> n21 at minute 3 is cheapest next to r2's pickup (same node, zero time; the
  // tie goes to the earlier index) and before r2's drop-off.
  const direct = leg("n20", "n21");
  const inserted = insertGreedily(routing, world, {
    id: "~s1",
    requestTimeMs: 3 * MINUTE,
    originNodeId: "n20",
    destinationNodeId: "n21",
    directTravelTimeMs: direct,
  });
  assert.ok(inserted);
  assert.deepEqual(
    v1.stops.map((stop) => `${stop.requestId}:${stop.kind}`),
    ["~s1:pickup", "r2:pickup", "~s1:dropoff", "r2:dropoff"],
  );
  const sampledDrop = atPickup + direct;
  const r2Drop = sampledDrop + leg("n21", "n22");
  // r1: delay 0 (served at its direct time); r2 and ~s1: drop-off minus release minus direct.
  assert.equal(
    totalCostMs2(routing, world),
    (r2Drop - 2 * MINUTE) ** 2 + (sampledDrop - 3 * MINUTE - direct) ** 2,
  );
});

test("demand history estimates the rate from what it has seen and samples inside the horizon", () => {
  const history = new DemandHistory();
  assert.deepEqual(history.sampleFuture(createRng(1), 0, 10 * MINUTE), []);
  const o = observation();
  history.observe(o);
  history.observe(o);
  assert.equal(history.count, 2);
  // Two requests at t=0 seen at t=0: elapsed is floored to five minutes.
  assert.equal(history.ratePerMs(0), 2 / (5 * MINUTE));
  assert.equal(history.ratePerMs(20 * MINUTE), 2 / (20 * MINUTE));
  const future = history.sampleFuture(createRng(7), 10 * MINUTE, 40 * MINUTE);
  assert.ok(future.length > 0);
  assert.ok(future.every((item) => item.requestTimeMs > 10 * MINUTE));
  assert.ok(future.every((item) => item.requestTimeMs <= 40 * MINUTE));
  assert.ok(future.every((item) => item.id.startsWith("~s")));
  assert.ok(future.every((item) => ["n00", "n20"].includes(item.originNodeId)));
  assert.deepEqual(history.sampleFuture(createRng(7), 10 * MINUTE, 40 * MINUTE), future);
  assert.deepEqual(history.sampleFuture(createRng(7), 10 * MINUTE, 10 * MINUTE), []);
});

test("with zero samples the rollout reference is exactly the insertion rule", async () => {
  const { scenario, map } = loadFixture();
  const rule = createIndependentPolicy();
  const ruleLog = await runSimulation(scenario, map, rule);
  const rollout = createRolloutReferencePolicy({
    map,
    demandEndTimeMs: scenario.demandEndTimeMs,
    samples: 0,
  });
  const rolloutLog = await runSimulation(scenario, map, rollout);
  assert.deepEqual(
    rolloutLog.decisions.map((decision) => decision.action),
    ruleLog.decisions.map((decision) => decision.action),
  );
  assert.deepEqual(rolloutLog.journeys, ruleLog.journeys);
  assert.equal(rolloutLog.policy.id, "rollout-reference:empirical:k8:s0:h10");
});

test("rollouts are deterministic per seed, record their accounting, and replay", async () => {
  const { scenario, map } = loadFixture();
  const first = await runSimulation(
    scenario,
    map,
    createRolloutReferencePolicy({ map, demandEndTimeMs: scenario.demandEndTimeMs }),
  );
  const second = await runSimulation(
    scenario,
    map,
    createRolloutReferencePolicy({ map, demandEndTimeMs: scenario.demandEndTimeMs }),
  );
  assert.equal(first.termination.kind, "drained");
  const stripLatency = (log: typeof first) =>
    log.decisions.map(({ wallLatencyMs: _latency, ...rest }) => rest);
  assert.deepEqual(stripLatency(first), stripLatency(second));
  assert.equal(first.policy.kind, "rollout-reference");
  assert.equal(first.policy.settings?.["samples"], 64);
  const decision = first.decisions[1];
  assert.ok(decision?.usage !== undefined && decision.trace !== undefined);
  assert.equal(decision.usage["samples"], 64);
  assert.ok((decision.usage["shortlisted"] ?? 0) <= 8);
  assert.ok((decision.usage["meanSampledArrivals"] ?? 0) > 0, "history yields sampled arrivals");
  assert.ok(Array.isArray(decision.trace["shortlist"]));
  const last = first.decisions[first.decisions.length - 1];
  assert.equal(
    last?.usage?.["meanSampledArrivals"],
    0,
    "nothing is sampled past the demand window",
  );
  const replay = await verifyReplay(scenario, map, first);
  assert.ok(replay.matches);
  const other = await runSimulation(
    scenario,
    map,
    createRolloutReferencePolicy({ map, demandEndTimeMs: scenario.demandEndTimeMs, seed: 5 }),
  );
  assert.equal(other.policy.id, first.policy.id, "the seed is a setting, not part of the id");
  assert.equal(other.policy.settings?.["seed"], 5);
});

test("the random reference draws from the rule's shortlist, deterministically per seed", async () => {
  const { scenario, map } = loadFixture();
  const policy = createRandomShortlistPolicy({ shortlist: 3, seed: 1 });
  assert.equal(policy.descriptor.id, "random-reference:top3");
  const first = await runSimulation(scenario, map, policy);
  const second = await runSimulation(
    scenario,
    map,
    createRandomShortlistPolicy({ shortlist: 3, seed: 1 }),
  );
  assert.equal(first.termination.kind, "drained");
  assert.deepEqual(
    first.decisions.map((d) => d.action),
    second.decisions.map((d) => d.action),
  );
  assert.ok(first.decisions.every((d) => (d.usage?.["shortlisted"] ?? 9) <= 3));
  const other = await runSimulation(
    scenario,
    map,
    createRandomShortlistPolicy({ shortlist: 3, seed: 2 }),
  );
  assert.notDeepEqual(
    first.decisions.map((d) => d.action),
    other.decisions.map((d) => d.action),
  );
  assert.equal(createRandomShortlistPolicy().descriptor.id, "random-reference:all");
});
