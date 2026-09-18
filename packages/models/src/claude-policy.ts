import Anthropic from "@anthropic-ai/sdk";
import { type JsonValue } from "@bus20/contracts/json-value";
import { parseJsonWithSchema } from "@bus20/contracts/json";
import { type Observation } from "@bus20/contracts/observation";
import { formatIssues } from "@bus20/contracts/result";
import { type PolicyDescriptor } from "@bus20/contracts/run-log";
import { type Decision, type Policy } from "@bus20/simulator/policy";
import { z } from "zod";
import { chooseCandidateAction } from "./choose-action.js";
import {
  assertChoiceFits,
  buildDecisionBrief,
  candidateIds,
  OBJECTIVE_TEXT,
  PROMPT_VERSION,
} from "./decision-brief.js";
import { usageRecord } from "./pricing.js";

export const DEFAULT_CLAUDE_MODEL_ID = "claude-opus-5" as const;
export const ANTHROPIC_PROVIDER = "anthropic" as const;
export const EFFORT_LEVELS = ["low", "medium", "high", "xhigh", "max"] as const;
export type Effort = (typeof EFFORT_LEVELS)[number];

const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_MAX_RETRIES = 2;
const MAX_OUTPUT_TOKENS = 4096;

const SYSTEM_PROMPT =
  `${OBJECTIVE_TEXT} Reply with JSON only: {"candidateId": <one of the offered ids>}. ` +
  "Do not invent ids and do not choose more than one.";

export interface ClaudePolicyOptions {
  readonly modelId?: string;
  readonly apiKey?: string;
  readonly effort?: Effort;
  readonly timeoutMs?: number;
  readonly maxRetries?: number;
  /** Injected transport for tests; production uses the SDK default. */
  readonly fetch?: typeof fetch;
}

interface Settings {
  readonly modelId: string;
  readonly effort: Effort;
  readonly timeoutMs: number;
  readonly maxRetries: number;
}

const replySchema = z.object({ candidateId: z.string().min(1) });

const outputFormat = (ids: readonly string[]) => ({
  type: "json_schema" as const,
  schema: {
    type: "object",
    properties: { candidateId: { type: "string", enum: [...ids] } },
    required: ["candidateId"],
    additionalProperties: false,
  },
});

const describe = (settings: Settings): PolicyDescriptor => ({
  id: `claude:${settings.modelId}:${settings.effort}`,
  kind: "general-llm",
  provider: ANTHROPIC_PROVIDER,
  modelId: settings.modelId,
  promptVersion: PROMPT_VERSION,
  settings: {
    effort: settings.effort,
    timeoutMs: settings.timeoutMs,
    maxRetries: settings.maxRetries,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
  },
});

const textOf = (message: Anthropic.Message): string =>
  message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

const parseChoice = (message: Anthropic.Message, ids: readonly string[]): string => {
  if (message.stop_reason !== "end_turn") {
    throw new Error(`claude stopped with ${String(message.stop_reason)}`);
  }
  const parsed = parseJsonWithSchema(replySchema, textOf(message));
  if (!parsed.ok) {
    throw new Error(`claude reply is not a candidate choice: ${formatIssues(parsed.issues)}`);
  }
  if (!ids.includes(parsed.value.candidateId)) {
    throw new Error(`claude chose unknown candidate "${parsed.value.candidateId}"`);
  }
  return parsed.value.candidateId;
};

const traceOf = (message: Anthropic.Message): Record<string, JsonValue> => ({
  provider: ANTHROPIC_PROVIDER,
  modelId: message.model,
  responseId: message.id,
  stopReason: message.stop_reason ?? null,
  text: textOf(message),
});

const toDecision = (
  settings: Settings,
  ids: readonly string[],
  observation: Observation,
  message: Anthropic.Message,
): Decision => {
  const usage = {
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
    cacheReadTokens: message.usage.cache_read_input_tokens ?? 0,
  };
  return {
    action: chooseCandidateAction(observation, parseChoice(message, ids)),
    usage: usageRecord(settings.modelId, usage, { candidatesOffered: ids.length }),
    trace: traceOf(message),
  };
};

const decideWith = async (
  client: Anthropic,
  settings: Settings,
  observation: Observation,
): Promise<Decision> => {
  assertChoiceFits(observation);
  const ids = candidateIds(observation);
  const message = await client.messages.create({
    model: settings.modelId,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: JSON.stringify(buildDecisionBrief(observation)) }],
    output_config: { effort: settings.effort, format: outputFormat(ids) },
  });
  return toDecision(settings, ids, observation, message);
};

/**
 * A general LLM (Claude) in the common candidate-choice track. The model
 * receives the same brief as Jev and must return one offered candidate ID as
 * structured output. No server-side fallback is enabled: a refusal or a
 * malformed reply fails the decision, and the failed run is kept as data.
 */
export const createClaudePolicy = (options: ClaudePolicyOptions = {}): Policy => {
  const settings: Settings = {
    modelId: options.modelId ?? DEFAULT_CLAUDE_MODEL_ID,
    effort: options.effort ?? "high",
    timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    maxRetries: options.maxRetries ?? DEFAULT_MAX_RETRIES,
  };
  const client = new Anthropic({
    ...(options.apiKey === undefined ? {} : { apiKey: options.apiKey }),
    ...(options.fetch === undefined ? {} : { fetch: options.fetch }),
    timeout: settings.timeoutMs,
    maxRetries: settings.maxRetries,
  });
  return {
    descriptor: describe(settings),
    decide: (observation) => decideWith(client, settings, observation),
  };
};
