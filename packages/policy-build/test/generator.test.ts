import assert from "node:assert/strict";
import { test } from "node:test";
import { z } from "zod";
import { createClaudeGenerator, extractProgram, generationTask } from "../src/generator.js";
import { PROGRAM_SPEC } from "../src/program-spec.js";

const requestSchema = z.object({
  model: z.string(),
  system: z.string(),
  messages: z.array(z.object({ role: z.literal("user"), content: z.string() })).length(1),
  output_config: z.object({ effort: z.string() }).strict(),
});

const message = (text: string, stopReason = "end_turn"): unknown => ({
  id: "msg_1",
  type: "message",
  role: "assistant",
  model: "claude-opus-5",
  content: [{ type: "text", text }],
  stop_reason: stopReason,
  stop_sequence: null,
  usage: { input_tokens: 3000, output_tokens: 800 },
});

const fakeFetch = (reply: () => unknown) => {
  const bodies: unknown[] = [];
  const impl = (_input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    bodies.push(JSON.parse(typeof init?.body === "string" ? init.body : "{}"));
    return Promise.resolve(
      new Response(JSON.stringify(reply()), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
  };
  return Object.assign(impl, { bodies });
};

test("extractProgram takes the single fenced block and rejects prose", () => {
  assert.equal(
    extractProgram("Here:\n```typescript\nfunction decide() {}\n```\nDone."),
    "function decide() {}\n",
  );
  assert.equal(extractProgram("```ts\nfunction decide() {}\n```"), "function decide() {}\n");
  assert.throws(() => extractProgram("function decide() {}"), /fenced typescript block/);
});

test("generation tasks distinguish initial attempts from revisions with feedback", () => {
  assert.match(generationTask({ kind: "initial", attempt: 2 }), /Attempt 2/);
  const revision = generationTask({
    kind: "revision",
    attempt: 1,
    previousSource: "function decide() {}",
    feedback: "Mean pain 12",
  });
  assert.match(revision, /function decide\(\) \{\}/);
  assert.match(revision, /Mean pain 12/);
});

test("Claude generator sends the spec as system prompt, no structured format, and records spend", async () => {
  const transport = fakeFetch(() =>
    message("```typescript\nfunction decide(o: any) { return o; }\n```"),
  );
  const generator = createClaudeGenerator({
    apiKey: "k",
    fetch: transport,
    maxRetries: 0,
    effort: "medium",
  });
  const output = await generator.generate({ kind: "initial", attempt: 0 });
  assert.equal(output.source, "function decide(o: any) { return o; }\n");
  assert.equal(output.modelId, "claude-opus-5");
  assert.equal(output.spend.inputTokens, 3000);
  assert.ok((output.spend.costUsd ?? 0) > 0);
  const sent = requestSchema.parse(transport.bodies[0]);
  assert.equal(sent.system, PROGRAM_SPEC);
  assert.equal(sent.output_config.effort, "medium");
  assert.ok(!sent.system.includes("Swift"));
  const refusing = createClaudeGenerator({
    apiKey: "k",
    fetch: fakeFetch(() => message("", "refusal")),
    maxRetries: 0,
  });
  await assert.rejects(refusing.generate({ kind: "initial", attempt: 0 }), /refusal/);
});
