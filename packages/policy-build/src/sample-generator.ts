import { createRng, seedFromLabel } from "@bus20/contracts/random";
import { type GenerationInput, type GenerationOutput, type ProgramGenerator } from "./generator.js";
import { PROGRAM_PROMPT_VERSION } from "./program-spec.js";
import { SAMPLE_LADDER } from "./sample-programs.js";

export const SAMPLE_PROVIDER = "sample" as const;
export const SAMPLE_MODEL_ID = "sample-ladder/1" as const;

/**
 * Offline stand-in for a model: initial attempts draw a random rung of the
 * sample ladder (seeded), and revisions move one rung up from the incumbent
 * when possible. It spends nothing and is never a result about any model.
 */
const outputFor = (rung: number, input: GenerationInput): GenerationOutput => ({
  source: SAMPLE_LADDER[rung] ?? SAMPLE_LADDER[0],
  language: "typescript",
  provider: SAMPLE_PROVIDER,
  modelId: SAMPLE_MODEL_ID,
  promptVersion: PROGRAM_PROMPT_VERSION,
  spend: { inputTokens: 0, outputTokens: 0, costUsd: 0, wallMs: 0 },
  trace: { rung, kind: input.kind, attempt: input.attempt },
});

export const createSampleGenerator = (seed: number): ProgramGenerator => {
  const rng = createRng(seedFromLabel(seed, "sample-generator"));
  const rungFor = (input: GenerationInput): number => {
    const current = SAMPLE_LADDER.findIndex((source) => source === input.previousSource);
    return input.kind === "revision" && current >= 0
      ? Math.min(current + 1, SAMPLE_LADDER.length - 1)
      : rng.int(SAMPLE_LADDER.length);
  };
  return { generate: (input) => Promise.resolve(outputFor(rungFor(input), input)) };
};
