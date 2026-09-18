import { runSimulation } from "@bus20/simulator/run";
import assert from "node:assert/strict";
import { test } from "node:test";
import { createOpenAIPolicy, DEFAULT_OPENAI_MODEL_ID } from "../src/openai-policy.js";
import {
  earliestPickupFromRequest,
  fakeFetch,
  loadFixture,
  openaiRequestSchema,
  openaiResponse,
} from "./fakes.js";

const chosenFor = (body: unknown): string => {
  const request = openaiRequestSchema.parse(body);
  const choice = earliestPickupFromRequest(JSON.parse(request.input));
  assert.ok(request.text.format.schema.properties.choice.enum.includes(choice));
  return choice;
};

test("OpenAI adapter sends the shared prompt with a strict schema and records usage and trace", async () => {
  const { scenario, map } = loadFixture();
  const transport = fakeFetch((request) =>
    openaiResponse(JSON.stringify({ choice: chosenFor(request.body) })),
  );
  const policy = createOpenAIPolicy({
    apiKey: "test-key",
    fetch: transport,
    maxRetries: 0,
    effort: "medium",
  });
  const log = await runSimulation(scenario, map, policy);
  assert.equal(log.termination.kind, "drained");
  assert.equal(log.decisions.length, 12);
  assert.equal(log.policy.id, "openai:gpt-5.6-sol:medium:consequences:auto");
  assert.equal(log.policy.kind, "general-llm");
  assert.equal(log.policy.provider, "openai");
  assert.equal(log.policy.modelId, DEFAULT_OPENAI_MODEL_ID);
  assert.equal(log.policy.promptVersion, "bus20-prompt/3");

  const first = transport.requests[0];
  assert.ok(first !== undefined);
  assert.match(first.url, /\/v1\/responses$/);
  assert.equal(first.headers["authorization"], "Bearer test-key");
  const sent = openaiRequestSchema.parse(first.body);
  assert.equal(sent.model, DEFAULT_OPENAI_MODEL_ID);
  assert.equal(sent.reasoning.effort, "medium");
  assert.deepEqual(sent.text.format.schema.properties.choice.enum, ["v1:0:1", "v2:0:1"]);
  assert.match(sent.instructions, /squared delay minutes/);
  assert.match(sent.instructions, /waitMinutes \+ detourMinutes/);
  assert.match(sent.input, /new_passenger_wait_minutes/);

  const decision = log.decisions[0];
  assert.ok(decision !== undefined);
  assert.equal(
    decision.action.kind === "chooseCandidate" ? decision.action.candidateId : "",
    "v1:0:1",
  );
  assert.ok(decision.usage !== undefined && decision.trace !== undefined);
  assert.equal(decision.usage["inputTokens"], 1200);
  assert.equal(decision.usage["cacheReadTokens"], 200);
  // 1000 uncached * $4/M + 200 cached * $0.4/M + 20 output * $20/M
  const expected = (1000 * 4 + 200 * 0.4 + 20 * 20) / 1_000_000;
  assert.ok(Math.abs((decision.usage["costUsd"] ?? 0) - expected) < 1e-12);
  const stages = decision.trace["stages"];
  assert.ok(Array.isArray(stages) && stages.length === 1);
  const [stage] = stages;
  assert.ok(typeof stage === "object" && stage !== null && !Array.isArray(stage));
  assert.equal(stage["provider"], "openai");
  assert.equal(stage["status"], "completed");
});

test("refusals, incomplete responses, malformed JSON, and unknown ids fail the decision", async () => {
  const { scenario, map } = loadFixture();
  const refusal = {
    id: "msg_test",
    type: "message",
    role: "assistant",
    status: "completed",
    content: [{ type: "refusal", refusal: "no" }],
  };
  const cases: readonly [string, unknown][] = [
    ["refusal", openaiResponse("", { output: [refusal] })],
    [
      "incomplete",
      openaiResponse('{"choice": "v1', {
        status: "incomplete",
        incomplete_details: { reason: "max_output_tokens" },
      }),
    ],
    ["malformed", openaiResponse("not json")],
    ["unknown", openaiResponse(JSON.stringify({ choice: "v9:9:9" }))],
  ];
  for (const [label, reply] of cases) {
    const transport = fakeFetch(() => reply);
    const log = await runSimulation(
      scenario,
      map,
      createOpenAIPolicy({ apiKey: "k", fetch: transport, maxRetries: 0 }),
    );
    assert.equal(log.termination.kind, "failed", label);
    assert.equal(log.termination.reason, "policyError", label);
    assert.equal(log.journeys.length, 0, label);
  }
});

test("a non-success HTTP status is reported, not retried forever", async () => {
  const { scenario, map } = loadFixture();
  const transport = fakeFetch(
    () =>
      new Response('{"error":{"type":"server_error","message":"busy"}}', {
        status: 503,
      }),
  );
  const log = await runSimulation(
    scenario,
    map,
    createOpenAIPolicy({ apiKey: "k", fetch: transport, maxRetries: 1 }),
  );
  assert.equal(log.termination.kind === "failed" ? log.termination.reason : "", "policyError");
  assert.equal(transport.requests.length, 2);
});
