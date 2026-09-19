import Anthropic from "@anthropic-ai/sdk";
import { type JsonValue } from "@bus20/contracts/json-value";
import { parseJsonWithSchema } from "@bus20/contracts/json";
import { formatIssues } from "@bus20/contracts/result";
import { type PolicyDescriptor } from "@bus20/contracts/run-log";
import { type Policy } from "@bus20/simulator/policy";
import { z } from "zod";
import { type ChoiceClient, type ChoiceReply, type ChoiceRequest } from "./choice-client.js";
import {
  type ChoiceSettings,
  choiceLabel,
  DEFAULT_CHOICE_SETTINGS,
  decideByChoice,
  describeChoice,
} from "./choice-procedure.js";
import { OBJECTIVE_TEXT } from "./decision-brief.js";
import { DEFAULT_EFFORT, type Effort } from "./effort.js";
import { type Presentation, type PresentationId, resolvePresentation } from "./presentation.js";
import { labelMap, optionLabel, optionLabels } from "./option-labels.js";
import { usageRecord } from "./pricing.js";

export const DEFAULT_CLAUDE_MODEL_ID = "claude-opus-5" as const;
export const ANTHROPIC_PROVIDER = "anthropic" as const;
const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_MAX_RETRIES = 2;
const MAX_OUTPUT_TOKENS = 4096;

const systemPrompt = (presentation: Presentation): string =>
  `${OBJECTIVE_TEXT} ${presentation.encodingText} ` +
  "Each message carries the current state, one question, and the options to choose from. " +
  'Reply with JSON only: {"choice": <one of the offered option ids>}. ' +
  "Do not invent ids and do not choose more than one.";

export interface ClaudePolicyOptions {
  readonly modelId?: string;
  readonly apiKey?: string;
  readonly effort?: Effort;
  readonly timeoutMs?: number;
  readonly maxRetries?: number;
  readonly choice?: ChoiceSettings;
  /** `consequences` (default, prompt v3) or `numeric` (prompt v2). */
  readonly presentation?: PresentationId | Presentation;
  /** Injected transport for tests; production uses the SDK default. */
  readonly fetch?: typeof fetch;
}

interface Settings {
  readonly modelId: string;
  readonly effort: Effort;
  readonly timeoutMs: number;
  readonly maxRetries: number;
  readonly choice: ChoiceSettings;
  readonly presentation: Presentation;
}

const replySchema = z.object({ choice: z.string().min(1) });

const outputFormat = (ids: readonly string[]) => ({
  type: "json_schema" as const,
  schema: {
    type: "object",
    properties: { choice: { type: "string", enum: [...ids] } },
    required: ["choice"],
    additionalProperties: false,
  },
});

const describe = (settings: Settings): PolicyDescriptor => ({
  id: `claude:${settings.modelId}:${settings.effort}:${settings.presentation.id}:${choiceLabel(settings.choice)}`,
  kind: "general-llm",
  provider: ANTHROPIC_PROVIDER,
  modelId: settings.modelId,
  promptVersion: settings.presentation.promptVersion,
  settings: {
    effort: settings.effort,
    presentation: settings.presentation.id,
    timeoutMs: settings.timeoutMs,
    maxRetries: settings.maxRetries,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    optionLabels: "letters",
    ...describeChoice(settings.choice),
  },
});

const textOf = (message: Anthropic.Message): string =>
  message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

/** The reply names a label; it maps back to the candidate id, or fails the decision. */
const parseChoice = (message: Anthropic.Message, ids: readonly string[]): string => {
  if (message.stop_reason !== "end_turn") {
    throw new Error(`claude stopped with ${String(message.stop_reason)}`);
  }
  const parsed = parseJsonWithSchema(replySchema, textOf(message));
  if (!parsed.ok) {
    throw new Error(`claude reply is not a choice: ${formatIssues(parsed.issues)}`);
  }
  const id = labelMap(ids).get(parsed.value.choice);
  if (id === undefined) {
    throw new Error(`claude chose unknown option "${parsed.value.choice}"`);
  }
  return id;
};

const traceOf = (
  message: Anthropic.Message,
  request: ChoiceRequest,
): Record<string, JsonValue> => ({
  provider: ANTHROPIC_PROVIDER,
  modelId: message.model,
  responseId: message.id,
  stopReason: message.stop_reason ?? null,
  question: request.question,
  text: textOf(message),
});

/** Options are labelled by position (A, B, ...); the labels are the ids the model replies with. */
const userMessage = (request: ChoiceRequest): string =>
  JSON.stringify({
    state: request.state,
    question: request.question,
    options: request.options.map((option, index) => ({
      id: optionLabel(index),
      ...option.description,
    })),
  });

/** Claude answers each structured choice with structured output constrained to the option ids. */
const toReply = (
  settings: Settings,
  request: ChoiceRequest,
  message: Anthropic.Message,
): ChoiceReply => {
  const ids = request.options.map((option) => option.id);
  const usage = {
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
    cacheReadTokens: message.usage.cache_read_input_tokens ?? 0,
  };
  return {
    choice: parseChoice(message, ids),
    usage: usageRecord(settings.modelId, usage, { optionsOffered: ids.length }),
    trace: traceOf(message, request),
  };
};

const createClaudeChoiceClient = (client: Anthropic, settings: Settings): ChoiceClient => ({
  ask: async (request): Promise<ChoiceReply> => {
    const message = await client.messages.create({
      model: settings.modelId,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: systemPrompt(settings.presentation),
      messages: [{ role: "user", content: userMessage(request) }],
      output_config: {
        effort: settings.effort,
        format: outputFormat(optionLabels(request.options.length)),
      },
    });
    return toReply(settings, request, message);
  },
});

const settingsOf = (options: ClaudePolicyOptions): Settings => ({
  modelId: options.modelId ?? DEFAULT_CLAUDE_MODEL_ID,
  effort: options.effort ?? DEFAULT_EFFORT,
  timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  maxRetries: options.maxRetries ?? DEFAULT_MAX_RETRIES,
  choice: options.choice ?? DEFAULT_CHOICE_SETTINGS,
  presentation: resolvePresentation(options.presentation),
});

/**
 * A general LLM (Claude) in the common candidate-choice track, flat or
 * hierarchical. No server-side fallback is enabled: a refusal or a malformed
 * reply fails the decision, and the failed run is kept as data.
 */
export const createClaudePolicy = (options: ClaudePolicyOptions = {}): Policy => {
  const settings = settingsOf(options);
  const client = new Anthropic({
    ...(options.apiKey === undefined ? {} : { apiKey: options.apiKey }),
    ...(options.fetch === undefined ? {} : { fetch: options.fetch }),
    timeout: settings.timeoutMs,
    maxRetries: settings.maxRetries,
  });
  const choiceClient = createClaudeChoiceClient(client, settings);
  return {
    descriptor: describe(settings),
    decide: (observation) =>
      decideByChoice(choiceClient, observation, settings.choice, settings.presentation),
  };
};
