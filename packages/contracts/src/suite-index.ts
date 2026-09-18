import { z } from "zod";
import { manifestScenarioSchema } from "./manifest.js";
import { policyDescriptorSchema } from "./run-log.js";
import { SUITE_INDEX_SCHEMA_VERSION } from "./versions.js";

const digestSchema = z.string().regex(/^sha256:[0-9a-f]{64}$/);

/** One (policy, scenario, repetition) run inside a paired suite. */
export const suiteRunSchema = z.object({
  policy: policyDescriptorSchema,
  scenario: manifestScenarioSchema,
  repetition: z.int().nonnegative(),
  /** Run directory as written by the suite runner. */
  dir: z.string().min(1),
  status: z.enum(["complete", "failed"]),
  pain: z.number().nonnegative().nullable(),
  failureReason: z.string().nullable(),
  failureDetail: z.string().nullable(),
  completedCount: z.int().nonnegative(),
  requestCount: z.int().positive(),
  decisions: z.int().nonnegative(),
  latencyMedianMs: z.number().nonnegative(),
  latencyP95Ms: z.number().nonnegative(),
  inputTokens: z.int().nonnegative(),
  outputTokens: z.int().nonnegative(),
  costUsd: z.number().nonnegative().nullable(),
  /** CPU spent inside a generated program across all decisions; 0 for other policies. */
  programCpuMs: z.number().nonnegative(),
  replayMatches: z.boolean(),
});

/** Index of a paired evaluation: every policy on every selected scenario. */
export const suiteIndexSchema = z.object({
  schemaVersion: z.literal(SUITE_INDEX_SCHEMA_VERSION),
  benchmarkVersion: z.string().min(1),
  manifestDigest: digestSchema,
  splits: z.array(z.string().min(1)),
  repetitions: z.int().positive(),
  runs: z.array(suiteRunSchema),
});

export type SuiteRun = z.infer<typeof suiteRunSchema>;
export type SuiteIndex = z.infer<typeof suiteIndexSchema>;
