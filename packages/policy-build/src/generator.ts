import Anthropic from "@anthropic-ai/sdk";
import { type GenerationSpend } from "@bus20/contracts/policy-artifact";
import { type JsonValue } from "@bus20/contracts/json-value";
import { estimateCostUsd } from "@bus20/models/pricing";
import { PROGRAM_PROMPT_VERSION, PROGRAM_SPEC } from "./program-spec.js";

export interface GenerationInput {
  readonly kind: "initial" | "revision";
  /** For revisions: the incumbent program's source and its evaluation feedback. */
  readonly previousSource?: string;
  readonly feedback?: string;
  /** Distinguishes independent restarts so a cached or deterministic model still varies. */
  readonly attempt: number;
}

export interface GenerationOutput {
  readonly source: string;
  readonly language: "typescript";
  readonly provider: string;
  readonly modelId: string;
  readonly promptVersion: string;
  readonly spend: GenerationSpend;
  readonly trace: Readonly<Record<string, JsonValue>>;
}

/** Anything that can write a program: a model adapter, or a fake in tests. */
export interface ProgramGenerator {
  readonly generate: (input: GenerationInput) => Promise<GenerationOutput>;
}

const OPEN_FENCES = ["```typescript\n", "```ts\n"] as const;
const CLOSE_FENCE = "```";

/** Extracts the single fenced TypeScript block; anything else is a generation failure. */
export const extractProgram = (text: string): string => {
  for (const fence of OPEN_FENCES) {
    const start = text.indexOf(fence);
    const end = start < 0 ? -1 : text.indexOf(CLOSE_FENCE, start + fence.length);
    if (start >= 0 && end >= 0) {
      const body = text.slice(start + fence.length, end);
      if (body.trim() !== "") {
        return body;
      }
    }
  }
  throw new Error("reply did not contain a fenced typescript block");
};

export const generationTask = (input: GenerationInput): string => {
  if (input.kind === "initial") {
    return `Attempt ${input.attempt}. Write the dispatch program now.`;
  }
  return [
    "Here is the current program:",
    "```typescript",
    input.previousSource ?? "",
    "```",
    "",
    "Evaluation feedback on the development scenarios:",
    input.feedback ?? "",
    "",
    "Revise the program to reduce mean pain while keeping every run complete and every action valid.",
    "Reply with the complete revised program in one fenced typescript block.",
  ].join("\n");
};

export interface ClaudeGeneratorOptions {
  readonly modelId?: string;
  readonly apiKey?: string;
  readonly effort?: "low" | "medium" | "high" | "xhigh" | "max";
  readonly timeoutMs?: number;
  readonly maxRetries?: number;
  readonly fetch?: typeof fetch;
}

const DEFAULT_MODEL_ID = "claude-opus-5";
const MAX_OUTPUT_TOKENS = 16_000;
const DEFAULT_TIMEOUT_MS = 600_000;

const textOf = (message: Anthropic.Message): string =>
  message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

const toOutput = (
  modelId: string,
  message: Anthropic.Message,
  startedAt: number,
): GenerationOutput => {
  if (message.stop_reason !== "end_turn") {
    throw new Error(`generation stopped with ${String(message.stop_reason)}`);
  }
  const text = textOf(message);
  return {
    source: extractProgram(text),
    language: "typescript",
    provider: "anthropic",
    modelId,
    promptVersion: PROGRAM_PROMPT_VERSION,
    spend: spendOf(modelId, message, startedAt),
    trace: { responseId: message.id, modelId: message.model, text },
  };
};

const spendOf = (
  modelId: string,
  message: Anthropic.Message,
  startedAt: number,
): GenerationSpend => {
  const usage = {
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  };
  return {
    ...usage,
    costUsd: estimateCostUsd(modelId, usage) ?? null,
    wallMs: performance.now() - startedAt,
  };
};

const createClient = (options: ClaudeGeneratorOptions): Anthropic =>
  new Anthropic({
    ...(options.apiKey === undefined ? {} : { apiKey: options.apiKey }),
    ...(options.fetch === undefined ? {} : { fetch: options.fetch }),
    timeout: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    maxRetries: options.maxRetries ?? 2,
  });

/** Program generation with Claude. No fallback model; a refusal is a failed generation. */
export const createClaudeGenerator = (options: ClaudeGeneratorOptions = {}): ProgramGenerator => {
  const modelId = options.modelId ?? DEFAULT_MODEL_ID;
  const client = createClient(options);
  const generate = async (input: GenerationInput): Promise<GenerationOutput> => {
    const startedAt = performance.now();
    const message = await client.messages.create({
      model: modelId,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: PROGRAM_SPEC,
      messages: [{ role: "user", content: generationTask(input) }],
      output_config: { effort: options.effort ?? "high" },
    });
    return toOutput(modelId, message, startedAt);
  };
  return { generate };
};
