import { budgetSchema, CAMPAIGN_MODES } from "@bus20/contracts/policy-artifact";
import { z } from "zod";

/** Experiment configuration file for `bus20-improve experiment`. */
export const experimentConfigSchema = z.object({
  id: z.string().min(1),
  /** Manifest path relative to the config file. */
  manifest: z.string().min(1),
  generator: z.discriminatedUnion("provider", [
    z.object({ provider: z.literal("sample") }),
    z.object({
      provider: z.literal("anthropic"),
      modelId: z.string().min(1),
      effort: z.enum(["low", "medium", "high", "xhigh", "max"]).optional(),
    }),
  ]),
  modes: z.array(z.enum(CAMPAIGN_MODES)).min(1),
  seeds: z.array(z.int().nonnegative()).min(1),
  budget: budgetSchema,
  devSplit: z.string().min(1).default("dev"),
  validationSplit: z.string().min(1).default("validation"),
  testSplit: z.string().min(1).default("test"),
  heldOutCities: z.array(z.string().min(1)).default([]),
  /** Reference policies on the test split: fixture always works; swift needs BUS20_SWIFT_CLI or swiftCli. */
  references: z.array(z.enum(["fixture", "swift"])).default(["fixture"]),
  swiftCli: z.string().min(1).optional(),
  runsPerArtifact: z.array(z.int().positive()).min(1).default([1, 10, 100, 1000]),
  onlinePreparationCostUsd: z.record(z.string(), z.number().nonnegative()).default({}),
});

export type ExperimentConfig = z.infer<typeof experimentConfigSchema>;
