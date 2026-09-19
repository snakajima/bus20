import { type Candidate, type CandidateStop, type Observation } from "@bus20/contracts/observation";
import { runSimulation } from "@bus20/simulator/run";
import assert from "node:assert/strict";
import { test } from "node:test";
import { askAll, type ChoiceClient, type ChoiceRequest } from "../src/choice-client.js";
import {
  choiceLabel,
  decideByChoice,
  describeChoice,
  shortlistObservation,
} from "../src/choice-procedure.js";
import { buildDecisionBrief, describeCandidate } from "../src/decision-brief.js";
import { labelMap, optionLabel, optionLabels } from "../src/option-labels.js";
import { NUMERIC_PRESENTATION } from "../src/presentation.js";
import { incrementalCosts } from "@bus20/baselines/insertion-rule";
import { APPEND, IDLE, INSERT, MINUTE, observation, stop } from "./choice-fixture.js";
import { loadFixture } from "./fakes.js";

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

/** The synthetic passengers q0.. behind `allInsertions`, so consequences can be computed. */
const syntheticRequests = (count: number): Observation["requests"] =>
  Array.from({ length: count }, (_, i) => ({
    id: `q${i}`,
    requestTimeMs: 0,
    originNodeId: "n00",
    destinationNodeId: "n01",
    phase: "assigned" as const,
    directTravelTimeMs: 0,
  }));

const bigObservation = (
  o: Observation,
  first: Observation["vehicles"][number],
  stops: CandidateStop[],
  candidates: Candidate[],
): Observation => ({
  ...o,
  vehicles: [{ ...first, stops }],
  candidates,
  requests: [...o.requests, ...syntheticRequests(stops.length)],
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
  const decision = await decideByChoice(
    twoStage,
    observation(),
    { mode: "hierarchical", flatLimit: 0 },
    NUMERIC_PRESENTATION,
  );
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

test("tournament mode chunks the candidates, batches the first round, and finals the winners", async () => {
  const o = observation();
  const { stops, candidates } = allInsertions(20);
  const [first] = o.vehicles;
  assert.ok(first !== undefined);
  const big = bigObservation(o, first, stops, candidates);
  const batches: ChoiceRequest[][] = [];
  const singles: ChoiceRequest[] = [];
  const client: ChoiceClient = {
    ask: (request) => {
      singles.push(request);
      return Promise.resolve({
        choice: request.options[1]?.id ?? "",
        usage: { inputTokens: 5 },
        trace: {},
      });
    },
    askMany: (requests) => {
      batches.push([...requests]);
      return Promise.resolve(
        requests.map((request, index) => ({
          choice: request.options[0]?.id ?? "",
          usage: { inputTokens: index === 0 ? 100 : 0 },
          trace: { batch: index },
        })),
      );
    },
  };
  const decision = await decideByChoice(client, big, {
    mode: "tournament",
    flatLimit: 50,
    chunkSize: 100,
  });
  assert.equal(batches.length, 1);
  assert.deepEqual(
    batches[0]?.map((request) => request.options.length),
    [100, 100, 31],
  );
  assert.equal(singles.length, 1);
  assert.deepEqual(
    singles[0]?.options.map((option) => option.id),
    ["v1:0:1", "v1:5:11", "v1:13:19"],
  );
  assert.equal(singles[0].state["round"], "final");
  assert.equal(chosen(decision), "v1:5:11");
  assert.ok(decision.usage !== undefined);
  assert.equal(decision.usage["stages"], 4);
  assert.equal(decision.usage["inputTokens"], 105);
  // Under the flat limit the tournament mode behaves as flat.
  const small = await decideByChoice(client, o, {
    mode: "tournament",
    flatLimit: 50,
    chunkSize: 100,
  });
  assert.equal(chosen(small), "v1:3:4");
  assert.equal(batches.length, 1);
});

test("askAll falls back to sequential asks when a client cannot batch", async () => {
  const seen: string[] = [];
  const client: ChoiceClient = {
    ask: (request) => {
      seen.push(typeof request.question === "string" ? request.question : "?");
      return Promise.resolve({ choice: request.options[0]?.id ?? "", usage: {}, trace: {} });
    },
  };
  const replies = await askAll(client, [
    { state: {}, question: "a", options: [{ id: "x", description: {} }] },
    { state: {}, question: "b", options: [{ id: "y", description: {} }] },
  ]);
  assert.deepEqual(seen, ["a", "b"]);
  assert.deepEqual(
    replies.map((reply) => reply.choice),
    ["x", "y"],
  );
});

test("a shortlist offers only the rule's cheapest insertions, in host order, without costs", async () => {
  const o = observation();
  const { stops, candidates } = allInsertions(20);
  const [first] = o.vehicles;
  assert.ok(first !== undefined);
  const big = bigObservation(o, first, stops, candidates);
  const shortlisted = shortlistObservation(big, 8);
  assert.equal(shortlisted.candidates.length, 8);
  const costs = new Map(
    incrementalCosts(big).map((item) => [item.candidate.id, item.incrementalCostMs2]),
  );
  const eighth = [...costs.values()].sort((a, b) => a - b)[7] ?? 0;
  assert.ok(shortlisted.candidates.every((c) => (costs.get(c.id) ?? Infinity) <= eighth));
  const hostOrder = big.candidates.map((c) => c.id);
  const kept = shortlisted.candidates.map((c) => c.id);
  assert.deepEqual(
    kept,
    hostOrder.filter((id) => kept.includes(id)),
    "host order is kept",
  );
  const client = scripted([(asked) => asked.options[2]?.id ?? ""]);
  const decision = await decideByChoice(client, big, {
    mode: "tournament",
    flatLimit: 50,
    shortlist: 8,
  });
  assert.equal(client.requests[0]?.options.length, 8);
  assert.ok(!JSON.stringify(client.requests[0]).includes("incrementalCost"), "costs are not shown");
  assert.equal(decision.usage?.["candidatesOffered"], 8);
  assert.equal(chosen(decision), kept[2]);
  assert.equal(choiceLabel({ mode: "tournament", flatLimit: 50, shortlist: 8 }), "tournament:top8");
  assert.equal(choiceLabel({ mode: "flat", flatLimit: 0 }), "flat");
  assert.deepEqual(describeChoice({ mode: "auto", flatLimit: 40, shortlist: 8 }), {
    choiceMode: "auto",
    flatLimit: 40,
    shortlist: 8,
  });
});

test("option labels are position based and round-trip through the label map", () => {
  assert.deepEqual(optionLabels(3), ["A", "B", "C"]);
  assert.equal(optionLabel(25), "Z");
  assert.equal(optionLabel(26), "AA");
  assert.equal(optionLabel(27), "AB");
  assert.equal(optionLabel(52), "BA");
  assert.equal(optionLabels(60).length, new Set(optionLabels(60)).size, "labels are distinct");
  const map = labelMap(["v1:0:1", "v2:0:1"]);
  assert.equal(map.get("B"), "v2:0:1");
  assert.equal(map.get("C"), undefined);
});
