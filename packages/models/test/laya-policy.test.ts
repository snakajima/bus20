import { runSimulation } from "@bus20/simulator/run";
import assert from "node:assert/strict";
import { test } from "node:test";
import { compactOption, createLayaPolicy, type LayaEngine } from "../src/laya-policy.js";
import { loadFixture } from "./fakes.js";

type Questions = Parameters<LayaEngine["systemOne"]>[1];

/** A fake engine that answers every question with the label of the earliest pickup. */
const fakeEngine = (calls: { state: unknown; questions: Questions }[]) => {
  let closed = 0;
  const engine: LayaEngine = {
    systemOne: (state, questions) => {
      calls.push({ state, questions });
      const answers = Object.fromEntries(
        Object.entries(questions).map(([key, question]) => {
          const labels = Object.keys(question.criteria);
          const probabilities = Object.fromEntries(labels.map((l) => [l, 1 / labels.length]));
          return [key, { type: "choice", choice: labels[0] ?? "", probabilities, confidence: 0.4 }];
        }),
      );
      return Promise.resolve({
        model: "laya-fake",
        answers,
        usage: { input_tokens: 300, output_tokens: 0 },
      });
    },
    close: () => {
      closed += 1;
      return Promise.resolve();
    },
  };
  return { engine, closedCount: () => closed };
};

test("Laya adapter renders options as short labelled strings and maps the answer back", async () => {
  const { scenario, map } = loadFixture();
  const calls: { state: unknown; questions: Questions }[] = [];
  const fake = fakeEngine(calls);
  const policy = createLayaPolicy({
    engine: () => Promise.resolve(fake.engine),
    choice: { mode: "flat", flatLimit: 0, shortlist: 8 },
    presentation: "cumulative",
  });
  const log = await runSimulation(scenario, map, policy);
  assert.equal(log.termination.kind, "drained");
  assert.equal(log.policy.id, "laya:cumulative:flat:top8:x1");
  assert.equal(log.policy.provider, "receptron");
  assert.equal(log.policy.promptVersion, "bus20-prompt/4");
  assert.equal(log.policy.settings?.["rendering"], "compact-string");
  const first = calls[0];
  assert.ok(first !== undefined);
  const question = first.questions["q0"];
  assert.ok(question !== undefined);
  assert.equal(question.type, "choice");
  assert.ok(typeof question.instructions === "string" && question.instructions.length < 80);
  const labels = Object.keys(question.criteria);
  assert.ok(labels.length <= 8 && labels[0] === "A");
  for (const text of Object.values(question.criteria)) {
    assert.ok(typeof text === "string");
    assert.ok(text.length <= 130, text);
    assert.match(text, /^picked up in \d+ minutes?, /);
  }
  const decision = log.decisions[0];
  assert.ok(decision?.usage !== undefined && decision.trace !== undefined);
  assert.equal(decision.usage["inputTokens"], 300);
  assert.equal(decision.usage["confidence"], 0.4);
  assert.ok(
    decision.action.kind === "chooseCandidate" &&
      /^v\d+:\d+:\d+$/.test(decision.action.candidateId),
  );
  await policy.close();
  assert.equal(fake.closedCount(), 1);
});

test("compact option keeps every presentation's fields in about twenty tokens", () => {
  const v4 = compactOption({
    id: "x",
    description: {
      what: "long sentence",
      new_passenger_wait_minutes: 3,
      new_passenger_detour_minutes: 2,
      passengers_delayed: 2,
      largest_delay_added_to_others_minutes: 4,
      largest_resulting_delay_to_others_minutes: 9,
    },
  });
  assert.equal(
    v4,
    "picked up in 3 minutes, 2 minutes of detour, delays 2 passengers by up to 4 minutes, one ending 9 minutes late",
  );
  const v5 = compactOption({
    id: "y",
    description: {
      new_passenger_wait_minutes: 1,
      new_passenger_detour_minutes: 0,
      passengers_delayed: 0,
      vehicle_free_in_minutes: 12,
      expected_nearby_requests_after: 1.5,
    },
  });
  assert.equal(
    v5,
    "picked up in 1 minute, direct ride, delays nobody else, free in 12 minutes with 1.5 requests expected nearby",
  );
});
