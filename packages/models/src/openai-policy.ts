import { type JsonValue } from "@bus20/contracts/json-value";
import { parseJsonWithSchema } from "@bus20/contracts/json";
import { formatIssues } from "@bus20/contracts/result";
import { type PolicyDescriptor } from "@bus20/contracts/run-log";
import { type Policy } from "@bus20/simulator/policy";
import OpenAI from "openai";
import { type Response as OpenAIResponse } from "openai/resources/responses/responses";
import { z } from "zod";
import { type ChoiceClient, type ChoiceReply, type ChoiceRequest } from "./choice-client.js";
import {
  type ChoiceSettings,
  DEFAULT_CHOICE_SETTINGS,
  decideByChoice,
} from "./choice-procedure.js";
import { OBJECTIVE_TEXT } from "./decision-brief.js";
import { DEFAULT_EFFORT, type Effort } from "./effort.js";
import {
  DEFAULT_PRESENTATION_ID,
  type Presentation,
  presentationById,
  type PresentationId,
} from "./presentation.js";
import { usageRecord } from "./pricing.js";

/**
 * Pinned model ID as listed on 2026-09-18. GPT-5.6 Sol is the OpenAI model
 * priced next to claude-opus-5 ($4/$20 vs $5/$25 per MTok); gpt-6-astra is
 * the flagship and selectable with --model.
 */
export const DEFAULT_OPENAI_MODEL_ID = "gpt-5.6-sol" as const;
export const OPENAI_PROVIDER = "openai" as const;
const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_MAX_RETRIES = 2;
const MAX_OUTPUT_TOKENS = 4096;
const COMPLETED = "completed" as const;
const SCHEMA_NAME = "candidate_choice" as const;

/** Same wording as the Claude adapter: the instruction text is part of the shared prompt. */
const instructions = (presentation: Presentation): string =>
  `${OBJECTIVE_TEXT} ${presentation.encodingText} ` +
  "Each message carries the current state, one question, and the options to choose from. " +
  'Reply with JSON only: {"choice": <one of the offered option ids>}. ' +
  "Do not invent ids and do not choose more than one.";

export interface OpenAIPolicyOptions {
  readonly modelId?: string;
  readonly apiKey?: string;
  readonly effort?: Effort;
  readonly timeoutMs?: number;
  readonly maxRetries?: number;
  readonly choice?: ChoiceSettings;
  /** `consequences` (default, prompt v3) or `numeric` (prompt v2). */
  readonly presentation?: PresentationId;
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

const textFormat = (ids: readonly string[]) => ({
  type: "json_schema" as const,
  name: SCHEMA_NAME,
  strict: true,
  schema: {
    type: "object",
    properties: { choice: { type: "string", enum: [...ids] } },
    required: ["choice"],
    additionalProperties: false,
  },
});

const describe = (settings: Settings): PolicyDescriptor => ({
  id: `openai:${settings.modelId}:${settings.effort}:${settings.presentation.id}:${settings.choice.mode}`,
  kind: "general-llm",
  provider: OPENAI_PROVIDER,
  modelId: settings.modelId,
  promptVersion: settings.presentation.promptVersion,
  settings: {
    effort: settings.effort,
    presentation: settings.presentation.id,
    timeoutMs: settings.timeoutMs,
    maxRetries: settings.maxRetries,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    choiceMode: settings.choice.mode,
    flatLimit: settings.choice.flatLimit,
  },
});

const refusalOf = (response: OpenAIResponse): string | undefined => {
  for (const item of response.output) {
    if (item.type === "message") {
      const refusal = item.content.find((part) => part.type === "refusal");
      if (refusal !== undefined) {
        return refusal.refusal;
      }
    }
  }
  return undefined;
};

const parseChoice = (response: OpenAIResponse, ids: readonly string[]): string => {
  if (response.status !== COMPLETED) {
    const reason = response.incomplete_details?.reason ?? response.error?.message ?? "unknown";
    throw new Error(`openai response ${String(response.status)}: ${reason}`);
  }
  const refusal = refusalOf(response);
  if (refusal !== undefined) {
    throw new Error(`openai refused: ${refusal}`);
  }
  const parsed = parseJsonWithSchema(replySchema, response.output_text);
  if (!parsed.ok) {
    throw new Error(`openai reply is not a choice: ${formatIssues(parsed.issues)}`);
  }
  if (!ids.includes(parsed.value.choice)) {
    throw new Error(`openai chose unknown option "${parsed.value.choice}"`);
  }
  return parsed.value.choice;
};

const traceOf = (response: OpenAIResponse, request: ChoiceRequest): Record<string, JsonValue> => ({
  provider: OPENAI_PROVIDER,
  modelId: response.model,
  responseId: response.id,
  status: response.status ?? null,
  question: request.question,
  text: response.output_text,
});

const userMessage = (request: ChoiceRequest): string =>
  JSON.stringify({
    state: request.state,
    question: request.question,
    options: request.options.map((option) => ({ id: option.id, ...option.description })),
  });

/** OpenAI answers each structured choice with a strict JSON schema whose only value is an option id. */
const toReply = (
  settings: Settings,
  request: ChoiceRequest,
  response: OpenAIResponse,
): ChoiceReply => {
  const ids = request.options.map((option) => option.id);
  const usage = {
    inputTokens: response.usage?.input_tokens ?? 0,
    outputTokens: response.usage?.output_tokens ?? 0,
    cacheReadTokens: response.usage?.input_tokens_details.cached_tokens ?? 0,
  };
  return {
    choice: parseChoice(response, ids),
    usage: usageRecord(settings.modelId, usage, { optionsOffered: ids.length }),
    trace: traceOf(response, request),
  };
};

const createOpenAIChoiceClient = (client: OpenAI, settings: Settings): ChoiceClient => ({
  ask: async (request): Promise<ChoiceReply> => {
    const ids = request.options.map((option) => option.id);
    const response = await client.responses.create({
      model: settings.modelId,
      instructions: instructions(settings.presentation),
      input: userMessage(request),
      max_output_tokens: MAX_OUTPUT_TOKENS,
      reasoning: { effort: settings.effort },
      text: { format: textFormat(ids) },
      store: false,
    });
    return toReply(settings, request, response);
  },
});

const settingsOf = (options: OpenAIPolicyOptions): Settings => ({
  modelId: options.modelId ?? DEFAULT_OPENAI_MODEL_ID,
  effort: options.effort ?? DEFAULT_EFFORT,
  timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  maxRetries: options.maxRetries ?? DEFAULT_MAX_RETRIES,
  choice: options.choice ?? DEFAULT_CHOICE_SETTINGS,
  presentation: presentationById(options.presentation ?? DEFAULT_PRESENTATION_ID),
});

/**
 * A general LLM (OpenAI) in the common candidate-choice track, with the same
 * prompt, presentation, and choice procedure as the Claude adapter. A
 * refusal, an incomplete response, or a malformed reply fails the decision,
 * and the failed run is kept as data.
 */
export const createOpenAIPolicy = (options: OpenAIPolicyOptions = {}): Policy => {
  const settings = settingsOf(options);
  const client = new OpenAI({
    ...(options.apiKey === undefined ? {} : { apiKey: options.apiKey }),
    ...(options.fetch === undefined ? {} : { fetch: options.fetch }),
    timeout: settings.timeoutMs,
    maxRetries: settings.maxRetries,
  });
  const choiceClient = createOpenAIChoiceClient(client, settings);
  return {
    descriptor: describe(settings),
    decide: (observation) =>
      decideByChoice(choiceClient, observation, settings.choice, settings.presentation),
  };
};
