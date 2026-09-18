import { type JsonValue } from "@bus20/contracts/json-value";
import { type PolicyDescriptor } from "@bus20/contracts/run-log";
import { type Policy } from "@bus20/simulator/policy";
import {
  choice,
  type ChoiceCriteria,
  type ChoiceQuestion,
  type Fetch,
  type SystemOneResult,
  TypeSafeClient,
} from "@typesafe-ai/sdk";
import { type ChoiceClient, type ChoiceReply, type ChoiceRequest } from "./choice-client.js";
import {
  type ChoiceSettings,
  DEFAULT_CHOICE_SETTINGS,
  decideByChoice,
} from "./choice-procedure.js";
import { PROMPT_VERSION } from "./decision-brief.js";
import { usageRecord } from "./pricing.js";

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
  /** Injected transport for tests; production uses the global fetch. */
  readonly fetch?: Fetch;
}

interface Settings {
  readonly modelId: string;
  readonly timeoutMs: number;
  readonly maxRetries: number;
  readonly choice: ChoiceSettings;
}

const describe = (settings: Settings): PolicyDescriptor => ({
  id: `jev:${settings.modelId}:${settings.choice.mode}`,
  kind: "jev",
  provider: JEV_PROVIDER,
  modelId: settings.modelId,
  promptVersion: PROMPT_VERSION,
  settings: {
    timeoutMs: settings.timeoutMs,
    maxRetries: settings.maxRetries,
    choiceMode: settings.choice.mode,
    flatLimit: settings.choice.flatLimit,
  },
});

const criteriaFor = (request: ChoiceRequest): ChoiceCriteria =>
  Object.fromEntries(request.options.map((option) => [option.id, { ...option.description }]));

/**
 * Jev answers each structured choice with its Choice primitive: the state is
 * the shared state, the options are the labels. Confidence and the
 * probability distribution are recorded but never treated as pain.
 */
type JevResult = SystemOneResult<{ answer: ChoiceQuestion }>;

const usageOf = (request: ChoiceRequest, result: JevResult): Readonly<Record<string, number>> => {
  const answer = result.answers.answer;
  const tokens = {
    inputTokens: result.usage.input_tokens,
    outputTokens: result.usage.output_tokens,
  };
  return usageRecord(result.model, tokens, {
    confidence: answer.confidence,
    chosenProbability: answer.probabilities[answer.choice] ?? 0,
    optionsOffered: request.options.length,
  });
};

const toReply = (request: ChoiceRequest, result: JevResult): ChoiceReply => {
  const answer = result.answers.answer;
  const probabilities: Record<string, JsonValue> = { ...answer.probabilities };
  return {
    choice: answer.choice,
    usage: usageOf(request, result),
    trace: {
      provider: JEV_PROVIDER,
      modelId: result.model,
      question: request.question,
      probabilities,
    },
  };
};

const createJevChoiceClient = (client: TypeSafeClient, modelId: string): ChoiceClient => ({
  ask: async (request): Promise<ChoiceReply> =>
    toReply(
      request,
      await client.systemOne({
        model: modelId,
        state: { ...request.state },
        questions: { answer: choice(request.question, criteriaFor(request)) },
      }),
    ),
});

/** Jev (TypeSafe AI) in the common candidate-choice track, flat or hierarchical. */
const settingsOf = (options: JevPolicyOptions): Settings => ({
  modelId: options.modelId ?? DEFAULT_JEV_MODEL_ID,
  timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  maxRetries: options.maxRetries ?? DEFAULT_MAX_RETRIES,
  choice: options.choice ?? DEFAULT_CHOICE_SETTINGS,
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
  const choiceClient = createJevChoiceClient(client, settings.modelId);
  return {
    descriptor: describe(settings),
    decide: (observation) => decideByChoice(choiceClient, observation, settings.choice),
  };
};
