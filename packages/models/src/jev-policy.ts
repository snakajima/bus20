import { type JsonValue } from "@bus20/contracts/json-value";
import { type PolicyDescriptor } from "@bus20/contracts/run-log";
import { type Policy } from "@bus20/simulator/policy";
import {
  choice,
  type ChoiceCriteria,
  type ChoiceQuestion,
  type ChoiceResponse,
  type Fetch,
  type SystemOneResult,
  TypeSafeClient,
} from "@typesafe-ai/sdk";
import { type ChoiceClient, type ChoiceReply, type ChoiceRequest } from "./choice-client.js";
import {
  choiceLabel,
  type ChoiceSettings,
  decideByChoice,
  describeChoice,
} from "./choice-procedure.js";
import { usageRecord } from "./pricing.js";
import {
  DEFAULT_PRESENTATION_ID,
  type Presentation,
  presentationById,
  type PresentationId,
} from "./presentation.js";
import { withSelfConsistency } from "./self-consistency.js";

/** Jev defaults to flat up to its practical token ceiling, then a chunked tournament. */
export const DEFAULT_JEV_CHOICE_SETTINGS: ChoiceSettings = {
  mode: "tournament",
  flatLimit: 180,
  chunkSize: 120,
};

/** Pinned model ID as listed on 2026-09-18; never a moving alias such as jev-latest. */
export const DEFAULT_JEV_MODEL_ID = "jev-1.13.0" as const;
export const JEV_PROVIDER = "typesafe" as const;
const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_MAX_RETRIES = 2;

export interface JevPolicyOptions {
  readonly modelId?: string;
  readonly apiKey?: string;
  readonly timeoutMs?: number;
  readonly maxRetries?: number;
  readonly choice?: ChoiceSettings;
  /** `consequences` (default, prompt v3) or `numeric` (prompt v2). */
  readonly presentation?: PresentationId;
  /** Self-consistency: ask each choice this many times with permuted option order and sum probabilities. */
  readonly repeats?: number;
  /** Injected transport for tests; production uses the global fetch. */
  readonly fetch?: Fetch;
}

interface Settings {
  readonly modelId: string;
  readonly timeoutMs: number;
  readonly maxRetries: number;
  readonly choice: ChoiceSettings;
  readonly presentation: Presentation;
  readonly repeats: number;
}

const describe = (settings: Settings): PolicyDescriptor => ({
  id: `jev:${settings.modelId}:${settings.presentation.id}:${choiceLabel(settings.choice)}:x${settings.repeats}`,
  kind: "jev",
  provider: JEV_PROVIDER,
  modelId: settings.modelId,
  promptVersion: settings.presentation.promptVersion,
  settings: {
    timeoutMs: settings.timeoutMs,
    maxRetries: settings.maxRetries,
    ...describeChoice(settings.choice),
    presentation: settings.presentation.id,
    repeats: settings.repeats,
  },
});

const criteriaFor = (request: ChoiceRequest): ChoiceCriteria =>
  Object.fromEntries(request.options.map((option) => [option.id, { ...option.description }]));

/**
 * Jev answers each structured choice with its Choice primitive: the state is
 * the shared state, the options are the labels. Confidence and the
 * probability distribution are recorded but never treated as pain.
 */
type JevAnswer = ChoiceResponse;
type JevResult = SystemOneResult<Record<string, ChoiceQuestion>>;

interface Tokens {
  readonly inputTokens: number;
  readonly outputTokens: number;
}

const replyFrom = (
  request: ChoiceRequest,
  modelId: string,
  answer: JevAnswer,
  tokens: Tokens,
): ChoiceReply => {
  const probabilities: Record<string, JsonValue> = { ...answer.probabilities };
  return {
    choice: answer.choice,
    usage: usageRecord(modelId, tokens, {
      confidence: answer.confidence,
      chosenProbability: answer.probabilities[answer.choice] ?? 0,
      optionsOffered: request.options.length,
    }),
    trace: { provider: JEV_PROVIDER, modelId, question: request.question, probabilities },
  };
};

const answerOf = (result: JevResult, key: string): JevAnswer => {
  const answer = result.answers[key];
  if (answer === undefined) {
    throw new Error(`jev returned no answer for ${key}`);
  }
  return answer;
};

const tokensOf = (result: JevResult): Tokens => ({
  inputTokens: result.usage.input_tokens,
  outputTokens: result.usage.output_tokens,
});

const NO_TOKENS: Tokens = { inputTokens: 0, outputTokens: 0 };

const questionsFor = (requests: readonly ChoiceRequest[]): Record<string, ChoiceQuestion> =>
  Object.fromEntries(
    requests.map((request, index) => [`q${index}`, choice(request.question, criteriaFor(request))]),
  );

/**
 * One systemOne call per choice, or one call for several independent choices
 * over the same state (Jev scores each question on its own; tokens are
 * charged once, on the first reply).
 */
const createJevChoiceClient = (client: TypeSafeClient, modelId: string): ChoiceClient => {
  const call = (state: ChoiceRequest["state"], requests: readonly ChoiceRequest[]) =>
    client.systemOne({ model: modelId, state: { ...state }, questions: questionsFor(requests) });
  return {
    ask: async (request): Promise<ChoiceReply> =>
      manyReply(request, await call(request.state, [request]), 0),
    askMany: async (requests): Promise<ChoiceReply[]> => {
      const [first] = requests;
      if (first === undefined) {
        return [];
      }
      const result = await call(first.state, requests);
      return requests.map((request, index) => manyReply(request, result, index));
    },
  };
};

const manyReply = (request: ChoiceRequest, result: JevResult, index: number): ChoiceReply =>
  replyFrom(
    request,
    result.model,
    answerOf(result, `q${index}`),
    index === 0 ? tokensOf(result) : NO_TOKENS,
  );

/** Jev (TypeSafe AI) in the common candidate-choice track, flat or hierarchical. */
const settingsOf = (options: JevPolicyOptions): Settings => ({
  modelId: options.modelId ?? DEFAULT_JEV_MODEL_ID,
  timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  maxRetries: options.maxRetries ?? DEFAULT_MAX_RETRIES,
  choice: options.choice ?? DEFAULT_JEV_CHOICE_SETTINGS,
  presentation: presentationById(options.presentation ?? DEFAULT_PRESENTATION_ID),
  repeats: Math.max(1, Math.floor(options.repeats ?? 1)),
});

export const createJevPolicy = (options: JevPolicyOptions = {}): Policy => {
  const settings = settingsOf(options);
  const client = new TypeSafeClient({
    ...(options.apiKey === undefined ? {} : { apiKey: options.apiKey }),
    ...(options.fetch === undefined ? {} : { fetch: options.fetch }),
    defaultModel: settings.modelId,
    timeout: settings.timeoutMs,
    retry: { maxRetries: settings.maxRetries },
    logLevel: "off",
  });
  const single = createJevChoiceClient(client, settings.modelId);
  const choiceClient =
    settings.repeats > 1 ? withSelfConsistency(single, settings.repeats) : single;
  return {
    descriptor: describe(settings),
    decide: (observation) =>
      decideByChoice(choiceClient, observation, settings.choice, settings.presentation),
  };
};
