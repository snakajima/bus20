import { type JsonValue } from "@bus20/contracts/json-value";
import { validateWithSchema } from "@bus20/contracts/json";
import { formatIssues } from "@bus20/contracts/result";
import { type PolicyDescriptor } from "@bus20/contracts/run-log";
import { type Policy } from "@bus20/simulator/policy";
import { type ChoiceQuestion, Laya } from "@receptron/laya";
import { z } from "zod";
import {
  type ChoiceClient,
  type ChoiceOption,
  type ChoiceReply,
  type ChoiceRequest,
} from "./choice-client.js";
import {
  choiceLabel,
  type ChoiceSettings,
  decideByChoice,
  describeChoice,
} from "./choice-procedure.js";
import { usageRecord } from "./pricing.js";
import { type Presentation, type PresentationId, resolvePresentation } from "./presentation.js";
import { withSelfConsistency } from "./self-consistency.js";

/**
 * Laya (Convai Innovations), the open-source Jev-compatible System-1
 * decision model, run locally through `@receptron/laya` (ONNX Runtime).
 * Same Choice primitive as Jev, but the head that holds the question and
 * the options is capped at 192 tokens, so options are rendered as one
 * short sentence built from the presentation's fields and labelled A, B,
 * C... rather than as the structured objects Jev receives, and a choice
 * is at most six options (a tournament above that). Content is the same.
 */
export const LAYA_PROVIDER = "receptron" as const;
export const DEFAULT_LAYA_MODEL_ID = "convaiinnovations/laya@onnx" as const;
export const LAYA_PACKAGE = "@receptron/laya" as const;
export const LAYA_RENDERING = "compact-string" as const;

/** Question labels: one token each, so the option text budget goes to the consequences. */
const LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
/** Beyond six options the per-option token budget truncates the sentence and choices go flat (probed). */
export const LAYA_MAX_OPTIONS = 6;

/** The head budget leaves about 16 tokens for the instructions with 8 options; keep them short. */
const INSTRUCTIONS = "Pick the option with the smallest total squared passenger delay.";

/** The part of `Laya` the adapter uses; results are still validated at the boundary. */
export interface LayaEngine {
  systemOne(state: unknown, questions: Record<string, ChoiceQuestion>): Promise<unknown>;
  close(): Promise<void>;
}

export interface LayaPolicyOptions {
  readonly modelId?: string;
  /** Local ONNX bundle directory; default is the package's Hugging Face cache. */
  readonly modelDir?: string;
  /** ONNX intra-op threads; bound it when several runs share a machine. */
  readonly threads?: number;
  readonly choice?: ChoiceSettings;
  readonly presentation?: PresentationId | Presentation;
  readonly repeats?: number;
  /** Injected engine for tests; production loads `@receptron/laya`. */
  readonly engine?: () => Promise<LayaEngine>;
}

interface Settings {
  readonly modelId: string;
  readonly choice: ChoiceSettings;
  readonly presentation: Presentation;
  readonly repeats: number;
}

export const DEFAULT_LAYA_CHOICE_SETTINGS: ChoiceSettings = {
  mode: "tournament",
  flatLimit: LAYA_MAX_OPTIONS,
  chunkSize: LAYA_MAX_OPTIONS,
};

const answerSchema = z.object({
  type: z.literal("choice"),
  choice: z.string(),
  probabilities: z.record(z.string(), z.number()),
  confidence: z.number(),
});

const resultSchema = z.object({
  model: z.string(),
  answers: z.record(z.string(), answerSchema),
  usage: z.object({ input_tokens: z.int().nonnegative(), output_tokens: z.int().nonnegative() }),
});

type LayaResult = z.infer<typeof resultSchema>;

const describe = (settings: Settings): PolicyDescriptor => ({
  id: `laya:${settings.presentation.id}:${choiceLabel(settings.choice)}:x${settings.repeats}`,
  kind: "jev",
  provider: LAYA_PROVIDER,
  modelId: settings.modelId,
  promptVersion: settings.presentation.promptVersion,
  settings: {
    package: LAYA_PACKAGE,
    rendering: LAYA_RENDERING,
    ...describeChoice(settings.choice),
    presentation: settings.presentation.id,
    repeats: settings.repeats,
  },
});

const num = (description: Record<string, JsonValue>, key: string): number | undefined => {
  const value = description[key];
  return typeof value === "number" ? value : undefined;
};

const plural = (count: number | undefined, noun: string): string =>
  count === undefined ? `? ${noun}s` : `${count} ${noun}${count === 1 ? "" : "s"}`;

const othersInWords = (d: Record<string, JsonValue>): string => {
  const delayed = num(d, "passengers_delayed") ?? 0;
  if (delayed === 0) {
    return "delays nobody else";
  }
  const added =
    num(d, "largest_delay_added_to_others_minutes") ?? num(d, "largest_delay_to_others_minutes");
  const resulting = num(d, "largest_resulting_delay_to_others_minutes");
  const ending = resulting === undefined ? "" : `, one ending ${plural(resulting, "minute")} late`;
  return `delays ${plural(delayed, "passenger")} by up to ${plural(added, "minute")}${ending}`;
};

const forecastInWords = (d: Record<string, JsonValue>): string => {
  const nearby = num(d, "expected_nearby_requests_after");
  const free = num(d, "vehicle_free_in_minutes");
  return nearby === undefined
    ? ""
    : `, free in ${plural(free, "minute")} with ${nearby} requests expected nearby`;
};

/**
 * Words, not codes: Laya reads "picked up in 3 minutes" far better than
 * "wait 3m" (probed on 2026-09-19). About 30 tokens, which fits the head
 * budget with up to six options.
 */
export const compactOption = (option: ChoiceOption): string => {
  const d = option.description;
  const wait = num(d, "new_passenger_wait_minutes");
  const detour = num(d, "new_passenger_detour_minutes") ?? 0;
  const ride = detour === 0 ? "direct ride" : `${plural(detour, "minute")} of detour`;
  return `picked up in ${plural(wait, "minute")}, ${ride}, ${othersInWords(d)}${forecastInWords(d)}`;
};

const criteriaFor = (request: ChoiceRequest): Record<string, string | null> =>
  Object.fromEntries(
    request.options.map((option, index) => [LABELS[index] ?? String(index), compactOption(option)]),
  );

const questionsFor = (requests: readonly ChoiceRequest[]) =>
  Object.fromEntries(
    requests.map((request, index) => [
      `q${index}`,
      { type: "choice" as const, instructions: INSTRUCTIONS, criteria: criteriaFor(request) },
    ]),
  );

const parseResult = (raw: unknown): LayaResult => {
  const parsed = validateWithSchema(resultSchema, raw);
  if (!parsed.ok) {
    throw new Error(`laya returned an invalid result: ${formatIssues(parsed.issues)}`);
  }
  return parsed.value;
};

type LayaAnswer = z.infer<typeof answerSchema>;

const answerOf = (result: LayaResult, index: number): LayaAnswer => {
  const answer = result.answers[`q${index}`];
  if (answer === undefined) {
    throw new Error(`laya returned no answer for q${index}`);
  }
  return answer;
};

/** Labels back to candidate ids; an unknown label fails the decision. */
const unlabel = (
  request: ChoiceRequest,
  answer: LayaAnswer,
): { choice: string; probabilities: Record<string, JsonValue> } => {
  const byLabel = new Map(request.options.map((option, i) => [LABELS[i] ?? String(i), option.id]));
  const choice = byLabel.get(answer.choice);
  if (choice === undefined) {
    throw new Error(`laya chose unknown label "${answer.choice}"`);
  }
  return {
    choice,
    probabilities: Object.fromEntries(
      Object.entries(answer.probabilities).map(([label, p]) => [byLabel.get(label) ?? label, p]),
    ),
  };
};

/** Tokens are charged once per call, on the first reply, as with Jev. */
const replyFrom = (
  request: ChoiceRequest,
  modelId: string,
  result: LayaResult,
  index: number,
): ChoiceReply => {
  const answer = answerOf(result, index);
  const { choice, probabilities } = unlabel(request, answer);
  return {
    choice,
    usage: usageOf(modelId, result, answer, index, request.options.length),
    trace: {
      provider: LAYA_PROVIDER,
      modelId: result.model,
      question: INSTRUCTIONS,
      probabilities,
    },
  };
};

const usageOf = (
  modelId: string,
  result: LayaResult,
  answer: LayaAnswer,
  index: number,
  optionsOffered: number,
): Readonly<Record<string, number>> => {
  const tokens = index === 0 ? result.usage : { input_tokens: 0, output_tokens: 0 };
  return usageRecord(
    modelId,
    { inputTokens: tokens.input_tokens, outputTokens: tokens.output_tokens },
    {
      confidence: answer.confidence,
      chosenProbability: answer.probabilities[answer.choice] ?? 0,
      optionsOffered,
    },
  );
};

/** Loads the ONNX session (and downloads the bundle on first use unless `modelDir` is given). */
const loadPackage = (
  modelDir: string | undefined,
  threads: number | undefined,
): Promise<LayaEngine> =>
  Laya.load({
    ...(modelDir === undefined ? {} : { modelDir }),
    ...(threads === undefined ? {} : { sessionOptions: { intraOpNumThreads: threads } }),
  });

/** One systemOne call per choice, or one batched call for several choices over the same state. */
const createLayaChoiceClient = (
  engine: () => Promise<LayaEngine>,
  modelId: string,
): ChoiceClient => {
  const call = async (state: ChoiceRequest["state"], requests: readonly ChoiceRequest[]) =>
    parseResult(await (await engine()).systemOne({ ...state }, questionsFor(requests)));
  return {
    ask: async (request) => replyFrom(request, modelId, await call(request.state, [request]), 0),
    askMany: async (requests) => {
      const [first] = requests;
      if (first === undefined) {
        return [];
      }
      const result = await call(first.state, requests);
      return requests.map((request, index) => replyFrom(request, modelId, result, index));
    },
  };
};

export interface LayaPolicy extends Policy {
  /** Releases the ONNX session; safe to call when the model was never loaded. */
  readonly close: () => Promise<void>;
}

/** Loads the model once, on the first decision, and shares it across decisions. */
const lazyEngine = (factory: () => Promise<LayaEngine>) => {
  let loading: Promise<LayaEngine> | undefined;
  return {
    get: (): Promise<LayaEngine> => (loading ??= factory()),
    close: async (): Promise<void> => {
      if (loading !== undefined) {
        await (await loading).close();
      }
    },
  };
};

export const createLayaPolicy = (options: LayaPolicyOptions = {}): LayaPolicy => {
  const settings: Settings = {
    modelId: options.modelId ?? DEFAULT_LAYA_MODEL_ID,
    choice: options.choice ?? DEFAULT_LAYA_CHOICE_SETTINGS,
    presentation: resolvePresentation(options.presentation),
    repeats: Math.max(1, Math.floor(options.repeats ?? 1)),
  };
  const engine = lazyEngine(
    options.engine ?? (() => loadPackage(options.modelDir, options.threads)),
  );
  const single = createLayaChoiceClient(engine.get, settings.modelId);
  const client = settings.repeats > 1 ? withSelfConsistency(single, settings.repeats) : single;
  return {
    descriptor: describe(settings),
    decide: (observation) =>
      decideByChoice(client, observation, settings.choice, settings.presentation),
    close: engine.close,
  };
};
