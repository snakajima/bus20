import { type JsonValue } from "@bus20/contracts/json-value";
import { parseJsonWithSchema } from "@bus20/contracts/json";
import { formatIssues } from "@bus20/contracts/result";
import { type PolicyDescriptor } from "@bus20/contracts/run-log";
import { type Policy } from "@bus20/simulator/policy";
import {
  FinishReason,
  type GenerateContentResponse,
  GoogleGenAI,
  ThinkingLevel,
} from "@google/genai";
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
import {
  DEFAULT_PRESENTATION_ID,
  type Presentation,
  presentationById,
  type PresentationId,
} from "./presentation.js";
import { usageRecord } from "./pricing.js";

/**
 * Pinned model ID as listed on 2026-09-18: the newest stable Gemini model.
 * The only Gemini Pro at that date was a preview (`gemini-3.1-pro-preview`),
 * selectable with --model.
 */
export const DEFAULT_GEMINI_MODEL_ID = "gemini-3.8-flash" as const;
export const GEMINI_PROVIDER = "google" as const;
const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_MAX_RETRIES = 2;
const MAX_OUTPUT_TOKENS = 4096;
const JSON_MIME_TYPE = "application/json" as const;

/** Gemini exposes three thinking levels; the higher shared efforts map to HIGH. */
const THINKING_LEVELS: Readonly<Record<Effort, ThinkingLevel>> = {
  low: ThinkingLevel.LOW,
  medium: ThinkingLevel.MEDIUM,
  high: ThinkingLevel.HIGH,
  xhigh: ThinkingLevel.HIGH,
  max: ThinkingLevel.HIGH,
};

/** Same wording as the Claude adapter: the instruction text is part of the shared prompt. */
const systemInstruction = (presentation: Presentation): string =>
  `${OBJECTIVE_TEXT} ${presentation.encodingText} ` +
  "Each message carries the current state, one question, and the options to choose from. " +
  'Reply with JSON only: {"choice": <one of the offered option ids>}. ' +
  "Do not invent ids and do not choose more than one.";

export interface GeminiPolicyOptions {
  readonly modelId?: string;
  readonly apiKey?: string;
  readonly effort?: Effort;
  readonly timeoutMs?: number;
  readonly maxRetries?: number;
  readonly choice?: ChoiceSettings;
  /** `consequences` (default, prompt v3) or `numeric` (prompt v2). */
  readonly presentation?: PresentationId;
  /** Injected transport for tests; production uses the global fetch. */
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

const responseJsonSchema = (ids: readonly string[]) => ({
  type: "object",
  properties: { choice: { type: "string", enum: [...ids] } },
  required: ["choice"],
  additionalProperties: false,
});

const describe = (settings: Settings): PolicyDescriptor => ({
  id: `gemini:${settings.modelId}:${settings.effort}:${settings.presentation.id}:${choiceLabel(settings.choice)}`,
  kind: "general-llm",
  provider: GEMINI_PROVIDER,
  modelId: settings.modelId,
  promptVersion: settings.presentation.promptVersion,
  settings: {
    effort: settings.effort,
    thinkingLevel: THINKING_LEVELS[settings.effort],
    presentation: settings.presentation.id,
    timeoutMs: settings.timeoutMs,
    maxRetries: settings.maxRetries,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    ...describeChoice(settings.choice),
  },
});

const finishReasonOf = (response: GenerateContentResponse): string => {
  const blocked = response.promptFeedback?.blockReason;
  if (blocked !== undefined) {
    return `blocked:${blocked}`;
  }
  return response.candidates?.[0]?.finishReason ?? "none";
};

const stoppedNormally = (response: GenerateContentResponse): boolean =>
  response.promptFeedback?.blockReason === undefined &&
  response.candidates?.[0]?.finishReason === FinishReason.STOP;

const parseChoice = (response: GenerateContentResponse, ids: readonly string[]): string => {
  if (!stoppedNormally(response)) {
    throw new Error(`gemini stopped with ${finishReasonOf(response)}`);
  }
  const parsed = parseJsonWithSchema(replySchema, response.text ?? "");
  if (!parsed.ok) {
    throw new Error(`gemini reply is not a choice: ${formatIssues(parsed.issues)}`);
  }
  if (!ids.includes(parsed.value.choice)) {
    throw new Error(`gemini chose unknown option "${parsed.value.choice}"`);
  }
  return parsed.value.choice;
};

const traceOf = (
  response: GenerateContentResponse,
  request: ChoiceRequest,
): Record<string, JsonValue> => ({
  provider: GEMINI_PROVIDER,
  modelId: response.modelVersion ?? null,
  responseId: response.responseId ?? null,
  finishReason: finishReasonOf(response),
  question: request.question,
  text: response.text ?? "",
});

const userMessage = (request: ChoiceRequest): string =>
  JSON.stringify({
    state: request.state,
    question: request.question,
    options: request.options.map((option) => ({ id: option.id, ...option.description })),
  });

/** Gemini answers each structured choice as JSON constrained to the offered ids; thinking tokens count as output. */
const toReply = (
  settings: Settings,
  request: ChoiceRequest,
  response: GenerateContentResponse,
): ChoiceReply => {
  const ids = request.options.map((option) => option.id);
  const meta = response.usageMetadata;
  const thoughtTokens = meta?.thoughtsTokenCount ?? 0;
  const usage = {
    inputTokens: meta?.promptTokenCount ?? 0,
    outputTokens: (meta?.candidatesTokenCount ?? 0) + thoughtTokens,
    cacheReadTokens: meta?.cachedContentTokenCount ?? 0,
  };
  return {
    choice: parseChoice(response, ids),
    usage: usageRecord(settings.modelId, usage, { optionsOffered: ids.length, thoughtTokens }),
    trace: traceOf(response, request),
  };
};

const createGeminiChoiceClient = (client: GoogleGenAI, settings: Settings): ChoiceClient => ({
  ask: async (request): Promise<ChoiceReply> => {
    const ids = request.options.map((option) => option.id);
    const response = await client.models.generateContent({
      model: settings.modelId,
      contents: userMessage(request),
      config: {
        systemInstruction: systemInstruction(settings.presentation),
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        responseMimeType: JSON_MIME_TYPE,
        responseJsonSchema: responseJsonSchema(ids),
        thinkingConfig: { thinkingLevel: THINKING_LEVELS[settings.effort] },
      },
    });
    return toReply(settings, request, response);
  },
});

const settingsOf = (options: GeminiPolicyOptions): Settings => ({
  modelId: options.modelId ?? DEFAULT_GEMINI_MODEL_ID,
  effort: options.effort ?? DEFAULT_EFFORT,
  timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  maxRetries: options.maxRetries ?? DEFAULT_MAX_RETRIES,
  choice: options.choice ?? DEFAULT_CHOICE_SETTINGS,
  presentation: presentationById(options.presentation ?? DEFAULT_PRESENTATION_ID),
});

/**
 * A general LLM (Gemini) in the common candidate-choice track, with the same
 * prompt, presentation, and choice procedure as the Claude and OpenAI
 * adapters. A blocked prompt, a non-STOP finish, or a malformed reply fails
 * the decision, and the failed run is kept as data. The API key is read by
 * the SDK from GEMINI_API_KEY (or GOOGLE_API_KEY) and never logged.
 */
export const createGeminiPolicy = (options: GeminiPolicyOptions = {}): Policy => {
  const settings = settingsOf(options);
  const client = new GoogleGenAI({
    ...(options.apiKey === undefined ? {} : { apiKey: options.apiKey }),
    httpOptions: {
      timeout: settings.timeoutMs,
      retryOptions: { attempts: settings.maxRetries + 1 },
      ...(options.fetch === undefined ? {} : { fetch: options.fetch }),
    },
  });
  const choiceClient = createGeminiChoiceClient(client, settings);
  return {
    descriptor: describe(settings),
    decide: (observation) =>
      decideByChoice(choiceClient, observation, settings.choice, settings.presentation),
  };
};
