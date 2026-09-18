import { runSimulation } from "@bus20/simulator/run";
import assert from "node:assert/strict";
import { test } from "node:test";
import { createGeminiPolicy, DEFAULT_GEMINI_MODEL_ID } from "../src/gemini-policy.js";
import {
  earliestPickupFromRequest,
  fakeFetch,
  geminiRequestSchema,
  geminiResponse,
  loadFixture,
} from "./fakes.js";

const chosenFor = (body: unknown): string => {
  const request = geminiRequestSchema.parse(body);
  const text = request.contents[0]?.parts[0]?.text ?? "";
  const choice = earliestPickupFromRequest(JSON.parse(text));
  assert.ok(request.generationConfig.responseJsonSchema.properties.choice.enum.includes(choice));
  return choice;
};

test("Gemini adapter sends the shared prompt as JSON output and records usage and trace", async () => {
  const { scenario, map } = loadFixture();
  const transport = fakeFetch((request) =>
    geminiResponse(JSON.stringify({ choice: chosenFor(request.body) })),
  );
  const policy = createGeminiPolicy({
    apiKey: "test-key",
    fetch: transport,
    maxRetries: 0,
    effort: "medium",
  });
  const log = await runSimulation(scenario, map, policy);
  assert.equal(log.termination.kind, "drained");
  assert.equal(log.decisions.length, 12);
  assert.equal(log.policy.id, "gemini:gemini-3.8-flash:medium:consequences:auto");
  assert.equal(log.policy.kind, "general-llm");
  assert.equal(log.policy.provider, "google");
  assert.equal(log.policy.modelId, DEFAULT_GEMINI_MODEL_ID);
  assert.equal(log.policy.promptVersion, "bus20-prompt/3");
  assert.equal(log.policy.settings?.["thinkingLevel"], "MEDIUM");

  const first = transport.requests[0];
  assert.ok(first !== undefined);
  assert.match(first.url, /models\/gemini-3\.8-flash:generateContent/);
  assert.equal(first.headers["x-goog-api-key"], "test-key");
  const sent = geminiRequestSchema.parse(first.body);
  assert.equal(sent.generationConfig.thinkingConfig.thinkingLevel, "MEDIUM");
  assert.deepEqual(sent.generationConfig.responseJsonSchema.properties.choice.enum, [
    "v1:0:1",
    "v2:0:1",
  ]);
  const instruction = sent.systemInstruction.parts.map((part) => part.text).join("");
  assert.match(instruction, /squared delay minutes/);
  assert.match(instruction, /waitMinutes \+ detourMinutes/);
  assert.match(sent.contents[0]?.parts[0]?.text ?? "", /new_passenger_wait_minutes/);

  const decision = log.decisions[0];
  assert.ok(decision !== undefined);
  assert.equal(
    decision.action.kind === "chooseCandidate" ? decision.action.candidateId : "",
    "v1:0:1",
  );
  assert.ok(decision.usage !== undefined && decision.trace !== undefined);
  assert.equal(decision.usage["inputTokens"], 1200);
  assert.equal(decision.usage["outputTokens"], 100, "thinking tokens count as output");
  assert.equal(decision.usage["thoughtTokens"], 80);
  // 1200 input * $0.75/M + 100 output * $3.75/M (no separate cache rate pinned)
  const expected = (1200 * 0.75 + 100 * 3.75) / 1_000_000;
  assert.ok(Math.abs((decision.usage["costUsd"] ?? 0) - expected) < 1e-12);
  const stages = decision.trace["stages"];
  assert.ok(Array.isArray(stages) && stages.length === 1);
  const [stage] = stages;
  assert.ok(typeof stage === "object" && stage !== null && !Array.isArray(stage));
  assert.equal(stage["provider"], "google");
  assert.equal(stage["finishReason"], "STOP");
});

test("blocked prompts, truncation, safety stops, malformed JSON, and unknown ids fail the decision", async () => {
  const { scenario, map } = loadFixture();
  const stopped = (finishReason: string, text: string) =>
    geminiResponse(text, {
      candidates: [{ content: { role: "model", parts: [{ text }] }, finishReason, index: 0 }],
    });
  const cases: readonly [string, unknown][] = [
    ["blocked", geminiResponse("", { candidates: [], promptFeedback: { blockReason: "SAFETY" } })],
    ["max_tokens", stopped("MAX_TOKENS", '{"choice": "v1')],
    ["safety", stopped("SAFETY", "")],
    ["malformed", geminiResponse("not json")],
    ["unknown", geminiResponse(JSON.stringify({ choice: "v9:9:9" }))],
  ];
  for (const [label, reply] of cases) {
    const transport = fakeFetch(() => reply);
    const log = await runSimulation(
      scenario,
      map,
      createGeminiPolicy({ apiKey: "k", fetch: transport, maxRetries: 0 }),
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
      new Response('{"error":{"code":503,"message":"busy","status":"UNAVAILABLE"}}', {
        status: 503,
      }),
  );
  const log = await runSimulation(
    scenario,
    map,
    createGeminiPolicy({ apiKey: "k", fetch: transport, maxRetries: 1 }),
  );
  assert.equal(log.termination.kind === "failed" ? log.termination.reason : "", "policyError");
  assert.equal(transport.requests.length, 2);
});
