import { runSimulation } from "@bus20/simulator/run";
import assert from "node:assert/strict";
import { test } from "node:test";
import { createClaudePolicy, DEFAULT_CLAUDE_MODEL_ID } from "../src/claude-policy.js";
import {
  claudeMessage,
  claudeRequestSchema,
  earliestPickupFromRequest,
  fakeFetch,
  loadFixture,
} from "./fakes.js";

const chosenFor = (body: unknown): string => {
  const request = claudeRequestSchema.parse(body);
  const [message] = request.messages;
  if (message === undefined) {
    throw new Error("no user message");
  }
  const choice = earliestPickupFromRequest(JSON.parse(message.content));
  assert.ok(request.output_config.format.schema.properties.choice.enum.includes(choice));
  return choice;
};

test("Claude adapter sends the brief with a constrained schema and records usage and trace", async () => {
  const { scenario, map } = loadFixture();
  const transport = fakeFetch((request) =>
    claudeMessage(JSON.stringify({ choice: chosenFor(request.body) })),
  );
  const policy = createClaudePolicy({
    apiKey: "test-key",
    fetch: transport,
    maxRetries: 0,
    effort: "medium",
  });
  const log = await runSimulation(scenario, map, policy);
  assert.equal(log.termination.kind, "drained");
  assert.equal(log.decisions.length, 12);
  assert.equal(log.policy.kind, "general-llm");
  assert.equal(log.policy.provider, "anthropic");
  assert.equal(log.policy.modelId, DEFAULT_CLAUDE_MODEL_ID);
  assert.equal(log.policy.settings?.["effort"], "medium");
  assert.equal(log.policy.settings["presentation"], "consequences");
  assert.equal(log.policy.promptVersion, "bus20-prompt/3");

  const first = transport.requests[0];
  assert.ok(first !== undefined);
  assert.match(first.url, /\/v1\/messages$/);
  assert.equal(first.headers["x-api-key"], "test-key");
  const sent = claudeRequestSchema.parse(first.body);
  assert.equal(sent.model, DEFAULT_CLAUDE_MODEL_ID);
  assert.equal(sent.output_config.effort, "medium");
  assert.deepEqual(sent.output_config.format.schema.properties.choice.enum, ["A", "B"]);
  assert.match(sent.messages[0]?.content ?? "", /"id":"A"/);
  assert.equal(log.policy.settings["optionLabels"], "letters");
  assert.match(sent.system, /squared delay minutes/);
  assert.match(sent.system, /waitMinutes \+ detourMinutes/);
  assert.match(JSON.stringify(sent.messages), /new_passenger_wait_minutes/);
  assert.ok(!("thinking" in sent), "adaptive thinking is the model default; nothing is overridden");

  const decision = log.decisions[0];
  assert.ok(decision !== undefined);
  assert.equal(
    decision.action.kind === "chooseCandidate" ? decision.action.candidateId : "",
    "v1:0:1",
  );
  assert.ok(decision.usage !== undefined && decision.trace !== undefined);
  assert.equal(decision.usage["inputTokens"], 1200);
  assert.equal(decision.usage["cacheReadTokens"], 200);
  // 1000 uncached * $5/M + 200 cached * $5/M + 20 output * $25/M
  assert.ok(Math.abs((decision.usage["costUsd"] ?? 0) - (1200 * 5 + 20 * 25) / 1_000_000) < 1e-12);
  const stages = decision.trace["stages"];
  assert.ok(Array.isArray(stages) && stages.length === 1);
  const [stage] = stages;
  assert.ok(typeof stage === "object" && stage !== null && !Array.isArray(stage));
  assert.equal(stage["provider"], "anthropic");
  assert.equal(stage["stopReason"], "end_turn");
  assert.equal(log.policy.settings["choiceMode"], "auto");
});

test("refusals, truncation, malformed JSON, and unknown ids fail the decision", async () => {
  const { scenario, map } = loadFixture();
  const cases: readonly [string, unknown][] = [
    ["refusal", claudeMessage("", { stop_reason: "refusal" })],
    ["max_tokens", claudeMessage('{"choice": "v1', { stop_reason: "max_tokens" })],
    ["malformed", claudeMessage("not json")],
    ["unknown", claudeMessage(JSON.stringify({ choice: "v9:9:9" }))],
  ];
  for (const [label, reply] of cases) {
    const transport = fakeFetch(() => reply);
    const log = await runSimulation(
      scenario,
      map,
      createClaudePolicy({ apiKey: "k", fetch: transport, maxRetries: 0, presentation: "numeric" }),
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
      new Response('{"type":"error","error":{"type":"overloaded_error","message":"busy"}}', {
        status: 529,
      }),
  );
  const log = await runSimulation(
    scenario,
    map,
    createClaudePolicy({ apiKey: "k", fetch: transport, maxRetries: 1 }),
  );
  assert.equal(log.termination.kind === "failed" ? log.termination.reason : "", "policyError");
  assert.equal(transport.requests.length, 2);
});
