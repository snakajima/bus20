import { type Observation } from "@bus20/contracts/observation";
import assert from "node:assert/strict";
import { test } from "node:test";
import { type ChoiceClient, type ChoiceRequest } from "../src/choice-client.js";
import {
  consequencesOf,
  cumulativeCandidateOption,
  jevCandidateOption,
  jevDecisionState,
  jevVehicleOption,
} from "../src/jev-native.js";
import { createJevPolicy } from "../src/jev-policy.js";
import { CONSEQUENCES_PRESENTATION, CUMULATIVE_PRESENTATION } from "../src/presentation.js";
import { withSelfConsistency } from "../src/self-consistency.js";
import { APPEND, IDLE, INSERT, observation } from "./choice-fixture.js";

test("consequences are computed in code as whole minutes", () => {
  const o = observation();
  assert.deepEqual(consequencesOf(o, INSERT), {
    waitMinutes: 3,
    detourMinutes: 3,
    othersDelayed: [
      { requestId: "r1", extraMinutes: 1, delayBeforeMinutes: 2 },
      { requestId: "r2", extraMinutes: 3, delayBeforeMinutes: 2 },
    ],
  });
  assert.deepEqual(consequencesOf(o, APPEND), {
    waitMinutes: 9,
    detourMinutes: 0,
    othersDelayed: [],
  });
  assert.deepEqual(consequencesOf(o, IDLE), {
    waitMinutes: 2,
    detourMinutes: 0,
    othersDelayed: [],
  });
});

test("options share the same named fields and a sentence; the state is filtered", () => {
  const o = observation();
  const option = jevCandidateOption(o, INSERT);
  assert.equal(option.id, "v1:1:3");
  assert.deepEqual(option.description, {
    what: "Vehicle v1: picked up in 3 minutes, 3 minutes of detour, delays r1 by 1 minute and r2 by 3 minutes.",
    vehicle: "v1",
    new_passenger_wait_minutes: 3,
    new_passenger_detour_minutes: 3,
    passengers_delayed: 2,
    largest_delay_to_others_minutes: 3,
  });
  assert.equal(
    jevCandidateOption(o, IDLE).description["what"],
    "Vehicle v2: picked up in 2 minutes, direct ride, delays nobody else.",
  );
  const state = JSON.stringify(jevDecisionState(o));
  assert.ok(
    !state.includes("plannedArrival") &&
      !state.includes("candidates") &&
      !state.includes("committedStops"),
  );
  assert.match(state, /"waiting_minutes_so_far":0/);
  const vehicle = o.vehicles[0];
  assert.ok(vehicle !== undefined);
  const stage = jevVehicleOption(o, vehicle, [INSERT, APPEND]);
  assert.equal(stage.description["soonest_pickup_minutes"], 3);
  const what = stage.description["what"];
  assert.ok(typeof what === "string");
  assert.match(what, /busy with 3 planned stops, 1 rider on board, soonest pickup in 3 minutes/);
});

test("self-consistency permutes option order, sums probabilities, and charges every call", async () => {
  const seen: ChoiceRequest[] = [];
  const noisy: ChoiceClient = {
    ask: (request) => {
      seen.push(request);
      // The first-listed option always wins, so only aggregation can pick the true favourite.
      const first = request.options[0]?.id ?? "";
      const probabilities = Object.fromEntries(
        request.options.map((option) => [
          option.id,
          option.id === first ? 0.6 : 0.4 / (request.options.length - 1),
        ]),
      );
      return Promise.resolve({
        choice: first,
        usage: { inputTokens: 10 },
        trace: { probabilities },
      });
    },
  };
  const client = withSelfConsistency(noisy, 3);
  const request: ChoiceRequest = {
    state: {},
    question: "q",
    options: [
      { id: "a", description: {} },
      { id: "b", description: {} },
      { id: "c", description: {} },
    ],
  };
  const reply = await client.ask(request);
  assert.equal(seen.length, 3);
  assert.deepEqual(
    seen[0]?.options.map((option) => option.id),
    ["a", "b", "c"],
  );
  assert.ok(
    seen.some((item) => item.options[0]?.id !== "a"),
    "later repeats permute the order",
  );
  assert.equal(reply.usage["inputTokens"], 30);
  assert.equal(reply.usage["repeats"], 3);
  const again = await withSelfConsistency(noisy, 3).ask(request);
  assert.equal(again.choice, reply.choice, "permutations are seeded by the request");
});

test("Jev policy defaults to the native presentation and records it", () => {
  const policy = createJevPolicy({ apiKey: "k", repeats: 2 });
  assert.equal(policy.descriptor.promptVersion, CONSEQUENCES_PRESENTATION.promptVersion);
  const { settings } = policy.descriptor;
  assert.ok(settings !== undefined);
  assert.equal(settings["presentation"], "consequences");
  assert.equal(settings["repeats"], 2);
  assert.equal(settings["choiceMode"], "tournament");
  assert.equal(settings["flatLimit"], 180);
  assert.equal(settings["chunkSize"], 120);
  assert.equal(
    createJevPolicy({ apiKey: "k", presentation: "numeric" }).descriptor.promptVersion,
    "bus20-prompt/2",
  );
});

test("native presentation drives the hierarchical procedure with a structured question", () => {
  const o: Observation = observation();
  assert.equal(typeof CONSEQUENCES_PRESENTATION.candidateQuestion, "object");
  assert.equal(CONSEQUENCES_PRESENTATION.state(o)["promptVersion"], "bus20-prompt/3");
});

test("prompt v4 says how late each delayed passenger already is; v3 text is unchanged", () => {
  const o = observation();
  const v4 = cumulativeCandidateOption(o, INSERT);
  assert.equal(
    v4.description["what"],
    "Vehicle v1: picked up in 3 minutes, 3 minutes of detour, delays r1 (already 2 minutes late) by 1 minute and r2 (already 2 minutes late) by 3 minutes.",
  );
  assert.equal(v4.description["largest_delay_added_to_others_minutes"], 3);
  assert.equal(v4.description["largest_resulting_delay_to_others_minutes"], 5);
  assert.equal(
    cumulativeCandidateOption(o, IDLE).description["what"],
    "Vehicle v2: picked up in 2 minutes, direct ride, delays nobody else.",
  );
  assert.equal(CUMULATIVE_PRESENTATION.promptVersion, "bus20-prompt/4");
  assert.equal(CUMULATIVE_PRESENTATION.state(o)["promptVersion"], "bus20-prompt/4");
  assert.match(CUMULATIVE_PRESENTATION.encodingText, /already late/);
  // Version 3 must stay byte-identical so its results remain comparable.
  assert.equal(
    jevCandidateOption(o, INSERT).description["what"],
    "Vehicle v1: picked up in 3 minutes, 3 minutes of detour, delays r1 by 1 minute and r2 by 3 minutes.",
  );
  assert.equal(
    createJevPolicy({ apiKey: "k", presentation: "cumulative" }).descriptor.promptVersion,
    "bus20-prompt/4",
  );
});
