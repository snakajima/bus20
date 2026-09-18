import { type JsonValue } from "@bus20/contracts/json-value";
import { type Observation } from "@bus20/contracts/observation";
import { type PolicyDescriptor } from "@bus20/contracts/run-log";
import { type Decision, type Policy } from "@bus20/simulator/policy";
import {
  choice,
  type ChoiceCriteria,
  type ChoiceQuestion,
  type Fetch,
  type SystemOneResult,
  TypeSafeClient,
} from "@typesafe-ai/sdk";
import { chooseCandidateAction } from "./choose-action.js";
import {
  assertChoiceFits,
  buildDecisionBrief,
  describeCandidate,
  PROMPT_VERSION,
} from "./decision-brief.js";
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
  /** Injected transport for tests; production uses the global fetch. */
  readonly fetch?: Fetch;
}

const QUESTION = "Which candidate should the new passenger be assigned to?";

const criteriaFor = (observation: Observation): ChoiceCriteria =>
  Object.fromEntries(
    observation.candidates.map((candidate) => [candidate.id, describeCandidate(candidate)]),
  );

const describe = (
  options: Required<Pick<JevPolicyOptions, "modelId" | "timeoutMs" | "maxRetries">>,
): PolicyDescriptor => ({
  id: `jev:${options.modelId}`,
  kind: "jev",
  provider: JEV_PROVIDER,
  modelId: options.modelId,
  promptVersion: PROMPT_VERSION,
  settings: { timeoutMs: options.timeoutMs, maxRetries: options.maxRetries },
});

const toDecision = (
  observation: Observation,
  result: SystemOneResult<{ candidate: ChoiceQuestion }>,
): Decision => {
  const answer = result.answers.candidate;
  const probabilities: Record<string, JsonValue> = { ...answer.probabilities };
  const tokens = {
    inputTokens: result.usage.input_tokens,
    outputTokens: result.usage.output_tokens,
  };
  return {
    action: chooseCandidateAction(observation, answer.choice),
    usage: usageRecord(result.model, tokens, {
      confidence: answer.confidence,
      chosenProbability: answer.probabilities[answer.choice] ?? 0,
      candidatesOffered: observation.candidates.length,
    }),
    trace: { provider: JEV_PROVIDER, modelId: result.model, probabilities },
  };
};

const decideWith = async (
  client: TypeSafeClient,
  modelId: string,
  observation: Observation,
): Promise<Decision> => {
  assertChoiceFits(observation);
  const result = await client.systemOne({
    model: modelId,
    state: buildDecisionBrief(observation),
    questions: { candidate: choice(QUESTION, criteriaFor(observation)) },
  });
  return toDecision(observation, result);
};

/**
 * Jev (TypeSafe AI) in the common candidate-choice track: the decision brief
 * is the state and the candidate IDs are the Choice options. Confidence and
 * the probability distribution are recorded but never treated as pain.
 */
export const createJevPolicy = (options: JevPolicyOptions = {}): Policy => {
  const modelId = options.modelId ?? DEFAULT_JEV_MODEL_ID;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const client = new TypeSafeClient({
    ...(options.apiKey === undefined ? {} : { apiKey: options.apiKey }),
    ...(options.fetch === undefined ? {} : { fetch: options.fetch }),
    defaultModel: modelId,
    timeout: timeoutMs,
    retry: { maxRetries },
    logLevel: "off",
  });
  return {
    descriptor: describe({ modelId, timeoutMs, maxRetries }),
    decide: (observation) => decideWith(client, modelId, observation),
  };
};
