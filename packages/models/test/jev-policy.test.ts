import { runSimulation } from "@bus20/simulator/run";
import assert from "node:assert/strict";
import { z } from "zod";
import { test } from "node:test";
import { createJevPolicy, DEFAULT_JEV_MODEL_ID } from "../src/jev-policy.js";
import { earliestPickupFromBrief, fakeFetch, jevRequestSchema, loadFixture } from "./fakes.js";

const respondWithChoice = (body: unknown, override?: string): unknown => {
  const request = jevRequestSchema.parse(body);
  const ids = Object.keys(request.questions.candidate.criteria);
  const choice = override ?? earliestPickupFromBrief(request.state);
  const probabilities = Object.fromEntries(
    ids.map((id) => [id, id === choice ? 0.7 : 0.3 / Math.max(1, ids.length - 1)]),
  );
  return {
    model: request.model,
    answers: { candidate: { type: "choice", choice, confidence: 0.61, probabilities } },
    usage: { input_tokens: 900, output_tokens: 4 },
  };
};

test("Jev adapter sends the brief as state, offers candidate IDs as options, and records usage", async () => {
  const { scenario, map } = loadFixture();
  const transport = fakeFetch((request) => respondWithChoice(request.body));
  const policy = createJevPolicy({ apiKey: "test-key", fetch: transport, maxRetries: 0 });
  const log = await runSimulation(scenario, map, policy);
  assert.equal(log.termination.kind, "drained");
  assert.equal(log.decisions.length, 12);
  assert.equal(log.policy.kind, "jev");
  assert.equal(log.policy.modelId, DEFAULT_JEV_MODEL_ID);
  assert.equal(log.policy.promptVersion, "bus20-prompt/1");

  const first = transport.requests[0];
  assert.ok(first !== undefined);
  assert.match(first.url, /\/v1\/systemone$/);
  assert.equal(first.headers["authorization"], "Bearer test-key");
  const sent = jevRequestSchema.parse(first.body);
  assert.equal(sent.model, DEFAULT_JEV_MODEL_ID);
  assert.equal(sent.state["decisionRequestId"], "r01");
  assert.deepEqual(Object.keys(sent.questions.candidate.criteria), ["v1:0:1", "v2:0:1"]);

  const decision = log.decisions[0];
  assert.ok(decision !== undefined);
  assert.equal(
    decision.action.kind === "chooseCandidate" ? decision.action.candidateId : "",
    "v1:0:1",
  );
  assert.ok(decision.usage !== undefined && decision.trace !== undefined);
  assert.equal(decision.usage["inputTokens"], 900);
  assert.equal(decision.usage["outputTokens"], 4);
  assert.equal(decision.usage["confidence"], 0.61);
  assert.equal(decision.usage["chosenProbability"], 0.7);
  assert.equal(decision.usage["candidatesOffered"], 2);
  assert.ok((decision.usage["costUsd"] ?? 0) > 0);
  assert.equal(decision.trace["provider"], "typesafe");
  assert.deepEqual(Object.keys(decision.trace["probabilities"] ?? {}), ["v1:0:1", "v2:0:1"]);
});

test("the brief never contains unreleased requests or cost fields", async () => {
  const { scenario, map } = loadFixture();
  const transport = fakeFetch((request) => respondWithChoice(request.body));
  await runSimulation(
    scenario,
    map,
    createJevPolicy({ apiKey: "k", fetch: transport, maxRetries: 0 }),
  );
  for (const request of transport.requests) {
    const sent = jevRequestSchema.parse(request.body);
    const now = Number(sent.state["nowMinutes"]);
    const requests = sent.state["requests"];
    assert.ok(Array.isArray(requests));
    for (const item of requests) {
      const record = z.object({ requestMinutes: z.number() }).parse(item);
      assert.ok(record.requestMinutes <= now);
    }
    assert.ok(!JSON.stringify(sent.state).includes("pain"));
  }
});

test("HTTP failures and unknown choices become policy errors that fail the run", async () => {
  const { scenario, map } = loadFixture();
  const failing = fakeFetch(() => new Response('{"error":"boom"}', { status: 500 }));
  const failedLog = await runSimulation(
    scenario,
    map,
    createJevPolicy({ apiKey: "k", fetch: failing, maxRetries: 0 }),
  );
  assert.equal(failedLog.termination.kind, "failed");
  assert.equal(failedLog.termination.reason, "policyError");
  assert.equal(failedLog.journeys.length, 0);

  const bogus = fakeFetch((request) => respondWithChoice(request.body, "v9:9:9"));
  const bogusLog = await runSimulation(
    scenario,
    map,
    createJevPolicy({ apiKey: "k", fetch: bogus, maxRetries: 0 }),
  );
  assert.equal(
    bogusLog.termination.kind === "failed" ? bogusLog.termination.reason : "",
    "invalidAction",
  );
});
