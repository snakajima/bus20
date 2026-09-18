/**
 * Pinned list prices used to convert token usage into USD. Prices change;
 * every entry records where and when it was read so results can state the
 * tariff they used. Unknown models get no cost rather than a guess.
 */
export interface Tariff {
  readonly inputUsdPerMillion: number;
  readonly outputUsdPerMillion: number;
  readonly cacheReadUsdPerMillion?: number;
  readonly retrievedAt: string;
  readonly source: string;
}

export const TARIFFS: Readonly<Record<string, Tariff>> = {
  "claude-opus-5": {
    inputUsdPerMillion: 5,
    outputUsdPerMillion: 25,
    retrievedAt: "2026-06-24",
    source: "Anthropic model list (claude-api skill cache)",
  },
  "claude-sonnet-5": {
    inputUsdPerMillion: 2,
    outputUsdPerMillion: 10,
    retrievedAt: "2026-06-24",
    source: "Anthropic model list (claude-api skill cache)",
  },
  "claude-haiku-4-5": {
    inputUsdPerMillion: 1,
    outputUsdPerMillion: 5,
    retrievedAt: "2026-06-24",
    source: "Anthropic model list (claude-api skill cache)",
  },
  "gpt-5.6-sol": {
    inputUsdPerMillion: 4,
    outputUsdPerMillion: 20,
    cacheReadUsdPerMillion: 0.4,
    retrievedAt: "2026-09-18",
    source: "https://developers.openai.com/api/docs/models/gpt-5.6-sol",
  },
  "gpt-6-astra": {
    inputUsdPerMillion: 10,
    outputUsdPerMillion: 50,
    retrievedAt: "2026-09-18",
    source: "https://developers.openai.com/api/docs/pricing",
  },
  "gemini-3.8-flash": {
    // Paid tier through 2026-12-31; thinking tokens are billed as output.
    inputUsdPerMillion: 0.75,
    outputUsdPerMillion: 3.75,
    retrievedAt: "2026-09-18",
    source: "https://ai.google.dev/gemini-api/docs/pricing",
  },
  "gemini-3.1-pro-preview": {
    // Prompts up to 200k tokens; thinking tokens are billed as output.
    inputUsdPerMillion: 2,
    outputUsdPerMillion: 12,
    retrievedAt: "2026-09-18",
    source: "https://ai.google.dev/gemini-api/docs/pricing",
  },
  "jev-1.13.0": {
    // Listed as "$42 / $0.042 per Btok/Mtok"; one rate for input and output.
    inputUsdPerMillion: 0.042,
    outputUsdPerMillion: 0.042,
    retrievedAt: "2026-09-18",
    source: "https://docs.typesafe.ai/models",
  },
};

export interface TokenUsage {
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cacheReadTokens?: number;
}

const TOKENS_PER_MILLION = 1_000_000;

/** Cost in USD at list price, or undefined when the model has no pinned tariff. */
export const estimateCostUsd = (modelId: string, usage: TokenUsage): number | undefined => {
  const tariff = TARIFFS[modelId];
  if (tariff === undefined) {
    return undefined;
  }
  const cacheRate = tariff.cacheReadUsdPerMillion ?? tariff.inputUsdPerMillion;
  const cacheRead = usage.cacheReadTokens ?? 0;
  const uncached = Math.max(0, usage.inputTokens - cacheRead);
  return (
    (uncached * tariff.inputUsdPerMillion +
      cacheRead * cacheRate +
      usage.outputTokens * tariff.outputUsdPerMillion) /
    TOKENS_PER_MILLION
  );
};

/** Numeric usage fields every model adapter records on a decision. */
export const usageRecord = (
  modelId: string,
  usage: TokenUsage,
  extra: Readonly<Record<string, number>> = {},
): Readonly<Record<string, number>> => {
  const costUsd = estimateCostUsd(modelId, usage);
  return {
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    ...(usage.cacheReadTokens === undefined ? {} : { cacheReadTokens: usage.cacheReadTokens }),
    ...(costUsd === undefined ? {} : { costUsd }),
    ...extra,
  };
};
