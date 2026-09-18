import { type Candidate, type CandidateStop, type Observation } from "@bus20/contracts/observation";
import { runSimulation } from "@bus20/simulator/run";
import assert from "node:assert/strict";
import { test } from "node:test";
import { type ChoiceClient, type ChoiceRequest } from "../src/choice-client.js";
import { decideByChoice } from "../src/choice-procedure.js";
import { buildDecisionBrief, describeCandidate } from "../src/decision-brief.js";
import { loadFixture } from "./fakes.js";

const MINUTE = 60_000;

const stop = (requestId: string, kind: "pickup" | "dropoff", at: number): CandidateStop => ({
  requestId,
  kind,
  nodeId: "n",
  plannedArrivalTimeMs: at,
});

const vehicle = (id: string, capacity: number, onboard: string[], stops: CandidateStop[]) => ({
  id,
  capacity,
  position: { kind: "atNode" as const, nodeId: "a" },
  onboardRequestIds: onboard,
  stops,
});

const request = (
  id: string,
  at: number,
  phase: "assigned" | "onboard" | "waiting",
  direct: number,
) => ({
  id,
  requestTimeMs: at,
  originNodeId: "d",
  destinationNodeId: "e",
  phase,
  directTravelTimeMs: direct,
});

/** r3 inserted after r1's pickup and after r1's drop-off: r1 shifts 1 min, r2 shifts 3 min. */
const INSERT: Candidate = {
  id: "v1:1:3",
  vehicleId: "v1",
  stops: [
    stop("r1", "pickup", 2 * MINUTE),
    stop("r3", "pickup", 4 * MINUTE),
    stop("r1", "dropoff", 6 * MINUTE),
    stop("r3", "dropoff", 9 * MINUTE),
    stop("r2", "dropoff", 11 * MINUTE),
  ],
};

/** r3 appended to v1: nothing shifts. */
const APPEND: Candidate = {
  id: "v1:3:4",
  vehicleId: "v1",
  stops: [
    stop("r1", "pickup", 2 * MINUTE),
    stop("r1", "dropoff", 5 * MINUTE),
    stop("r2", "dropoff", 8 * MINUTE),
    stop("r3", "pickup", 10 * MINUTE),
    stop("r3", "dropoff", 12 * MINUTE),
  ],
};

const IDLE: Candidate = {
  id: "v2:0:1",
  vehicleId: "v2",
  stops: [stop("r3", "pickup", 3 * MINUTE), stop("r3", "dropoff", 5 * MINUTE)],
};

/** v1 carries r1 (pickup at 2, drop at 5) and r2 (drop at 8); v2 is idle; v3 is full. */
const observation = (): Observation => ({
  schemaVersion: "bus20-observation/1",
  scenarioId: "s",
  stateVersion: 4,
  nowMs: MINUTE,
  decisionRequestId: "r3",
  vehicles: [
    vehicle(
      "v1",
      4,
      ["r2"],
      [
        stop("r1", "pickup", 2 * MINUTE),
        stop("r1", "dropoff", 5 * MINUTE),
        stop("r2", "dropoff", 8 * MINUTE),
      ],
    ),
    vehicle("v2", 4, [], []),
    vehicle("v3", 1, ["r9"], [stop("r9", "dropoff", 30 * MINUTE)]),
  ],
  requests: [
    request("r1", 0, "assigned", 3 * MINUTE),
    request("r2", 0, "onboard", 6 * MINUTE),
    request("r3", MINUTE, "waiting", 2 * MINUTE),
  ],
  candidates: [INSERT, APPEND, IDLE],
});

test("compact candidates carry insertion indices, the new passenger's times, and the two shifts", () => {
  const o = observation();
  assert.deepEqual(describeCandidate(o, INSERT), {
    vehicleId: "v1",
    pickupIndex: 1,
    dropoffIndex: 3,
    pickupMinutes: 4,
    dropoffMinutes: 9,
    shiftBetweenMinutes: 1,
    shiftAfterMinutes: 3,
  });
  assert.deepEqual(describeCandidate(o, APPEND), {
    vehicleId: "v1",
    pickupIndex: 3,
    dropoffIndex: 4,
    pickupMinutes: 10,
    dropoffMinutes: 12,
    shiftBetweenMinutes: null,
    shiftAfterMinutes: null,
  });
  assert.equal(describeCandidate(o, IDLE)["shiftAfterMinutes"], null);
  const brief = buildDecisionBrief(o);
  assert.ok(!JSON.stringify(brief).includes("pain"));
  assert.match(JSON.stringify(brief["candidateEncoding"]), /shiftBetweenMinutes/);
});

/** Every insertion of r3 into a vehicle with `count` committed stops, timed one minute apart. */
const allInsertions = (count: number): { stops: CandidateStop[]; candidates: Candidate[] } => {
  const stops = Array.from({ length: count }, (_, i) =>
    stop(`q${i}`, i % 2 === 0 ? "pickup" : "dropoff", (i + 1) * MINUTE),
  );
  const candidates: Candidate[] = [];
  for (let i = 0; i <= count; i += 1) {
    for (let j = i + 1; j <= count + 1; j += 1) {
      const withPickup = [...stops.slice(0, i), stop("r3", "pickup", 0), ...stops.slice(i)];
      const full = [...withPickup.slice(0, j), stop("r3", "dropoff", 0), ...withPickup.slice(j)];
      const timed = full.map((s, k) => ({ ...s, plannedArrivalTimeMs: (k + 1) * MINUTE }));
      candidates.push({ id: `v1:${i}:${j}`, vehicleId: "v1", stops: timed });
    }
  }
  return { stops, candidates };
};

test("compact encoding no longer grows with the cube of the stop list", () => {
  const o = observation();
  const { stops, candidates } = allInsertions(20);
  const [first] = o.vehicles;
  assert.ok(first !== undefined);
  const big: Observation = { ...o, vehicles: [{ ...first, stops }], candidates };
  const compact = JSON.stringify(buildDecisionBrief(big)).length;
  const verbose = JSON.stringify(candidates).length;
  assert.equal(candidates.length, 231);
  assert.ok(compact < verbose / 5, `compact ${compact} vs verbose ${verbose}`);
});

type Answer = (request: ChoiceRequest) => string;

const scripted = (
  answers: readonly Answer[],
): ChoiceClient & { readonly requests: ChoiceRequest[] } => {
  const requests: ChoiceRequest[] = [];
  return {
    requests,
    ask: (asked) => {
      requests.push(asked);
      const answer = answers[requests.length - 1];
      if (answer === undefined) {
        return Promise.reject(new Error("no scripted answer"));
      }
      const usage = { inputTokens: 100, costUsd: 0.01 };
      return Promise.resolve({ choice: answer(asked), usage, trace: { n: requests.length } });
    },
  };
};

const optionIds = (asked: ChoiceRequest | undefined): string[] =>
  (asked?.options ?? []).map((option) => option.id);

const chosen = (decision: { action: { kind: string; candidateId?: string } }): string =>
  decision.action.kind === "chooseCandidate" ? (decision.action.candidateId ?? "") : "";

test("flat mode asks once with every candidate", async () => {
  const flat = scripted([() => "v2:0:1"]);
  const decision = await decideByChoice(flat, observation(), { mode: "flat", flatLimit: 0 });
  assert.equal(flat.requests.length, 1);
  assert.deepEqual(optionIds(flat.requests[0]), ["v1:1:3", "v1:3:4", "v2:0:1"]);
  assert.equal(chosen(decision), "v2:0:1");
  assert.ok(decision.usage !== undefined);
  assert.equal(decision.usage["stages"], 1);
  assert.equal(decision.usage["candidatesOffered"], 3);
});

test("hierarchical mode asks for a vehicle, then an insertion, and sums usage", async () => {
  const twoStage = scripted([() => "v1", () => "v1:3:4"]);
  const decision = await decideByChoice(twoStage, observation(), {
    mode: "hierarchical",
    flatLimit: 0,
  });
  assert.equal(twoStage.requests.length, 2);
  const [first, second] = twoStage.requests;
  assert.ok(first !== undefined && second !== undefined);
  // v3 has no legal insertion, so it is not offered as a vehicle.
  assert.deepEqual(optionIds(first), ["v1", "v2"]);
  const [v1Option] = first.options;
  assert.ok(v1Option !== undefined);
  assert.equal(v1Option.description["legalInsertions"], 2);
  assert.equal(v1Option.description["earliestPickupMinutes"], 4);
  assert.deepEqual(optionIds(second), ["v1:1:3", "v1:3:4"]);
  assert.equal(second.state["chosenVehicleId"], "v1");
  assert.equal(chosen(decision), "v1:3:4");
  assert.ok(decision.usage !== undefined);
  assert.equal(decision.usage["stages"], 2);
  assert.equal(decision.usage["inputTokens"], 200);
  assert.ok(Math.abs((decision.usage["costUsd"] ?? 0) - 0.02) < 1e-12);
});

test("auto mode switches on the candidate count and a single eligible vehicle skips stage one", async () => {
  const o = observation();
  const auto = scripted([() => "v1:1:3"]);
  await decideByChoice(auto, o, { mode: "auto", flatLimit: 3 });
  assert.equal(auto.requests.length, 1);
  const autoHierarchical = scripted([() => "v2", () => "v2:0:1"]);
  await decideByChoice(autoHierarchical, o, { mode: "auto", flatLimit: 2 });
  assert.equal(autoHierarchical.requests.length, 2);
  const single: Observation = { ...o, candidates: [INSERT, APPEND] };
  const skipped = scripted([() => "v1:1:3"]);
  const decision = await decideByChoice(skipped, single, { mode: "hierarchical", flatLimit: 0 });
  assert.equal(skipped.requests.length, 1);
  assert.equal(decision.usage?.["stages"], 1);
});

test("hierarchical decisions drive a full run and unknown vehicle choices fail the decision", async () => {
  const { scenario, map } = loadFixture();
  const client: ChoiceClient = {
    ask: (choice) => Promise.resolve({ choice: choice.options[0]?.id ?? "", usage: {}, trace: {} }),
  };
  const settings = { mode: "hierarchical" as const, flatLimit: 0 };
  const policy = {
    descriptor: { id: "t", kind: "fixture" as const },
    decide: (o: Observation) => decideByChoice(client, o, settings),
  };
  const log = await runSimulation(scenario, map, policy);
  assert.ok(log.decisions.every((decision) => decision.outcome.status === "accepted"));
  const bogus = scripted([() => "v9"]);
  await assert.rejects(
    decideByChoice(bogus, observation(), settings),
    /no legal insertions for vehicle "v9"/,
  );
});
