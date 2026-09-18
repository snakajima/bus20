import { z } from "zod";
import { jsonValueSchema } from "./json-value.js";
import { suiteRunSchema } from "./suite-index.js";
import { CAMPAIGN_SCHEMA_VERSION, POLICY_PROGRAM_SCHEMA_VERSION } from "./versions.js";

const idSchema = z.string().min(1);
const digestSchema = z.string().regex(/^sha256:[0-9a-f]{64}$/);

export const PROGRAM_LANGUAGES = ["typescript", "javascript"] as const;
export const PROGRAM_ORIGINS = ["initial", "revision", "restart"] as const;

/** Spend of one generation call, kept per program so campaign costs add up exactly. */
export const generationSpendSchema = z.object({
  inputTokens: z.int().nonnegative(),
  outputTokens: z.int().nonnegative(),
  costUsd: z.number().nonnegative().nullable(),
  wallMs: z.number().nonnegative(),
});

/**
 * A generated dispatch program (track B), frozen with its source, compiled
 * form, digest, lineage, and the model call that produced it.
 */
export const policyProgramSchema = z.object({
  schemaVersion: z.literal(POLICY_PROGRAM_SCHEMA_VERSION),
  id: idSchema,
  campaignId: idSchema,
  version: z.int().nonnegative(),
  parentId: idSchema.nullable(),
  origin: z.enum(PROGRAM_ORIGINS),
  language: z.enum(PROGRAM_LANGUAGES),
  source: z.string().min(1),
  /** Empty when the program failed to compile; such programs are never run. */
  compiled: z.string(),
  compileError: z.string().nullable(),
  sourceDigest: digestSchema,
  generator: z.object({
    provider: idSchema,
    modelId: idSchema,
    promptVersion: idSchema,
  }),
  spend: generationSpendSchema,
  /** Raw model reply and request digest, for audit. */
  trace: z.record(z.string(), jsonValueSchema).optional(),
});

export const evaluationSummarySchema = z.object({
  runs: z.int().nonnegative(),
  completeRuns: z.int().nonnegative(),
  successRate: z.number().min(0).max(1),
  /** Mean pain over complete runs only; null when none completed. */
  conditionalMeanPain: z.number().nonnegative().nullable(),
  /** Host CPU spent inside the program across all decisions, ms. */
  programCpuMs: z.number().nonnegative(),
  failureReasons: z.record(z.string(), z.int().nonnegative()),
});

/** One program evaluated on one split of one suite. */
export const programEvaluationSchema = z.object({
  programId: idSchema,
  benchmarkVersion: idSchema,
  manifestDigest: digestSchema,
  split: idSchema,
  summary: evaluationSummarySchema,
  runs: z.array(suiteRunSchema),
});

export const CAMPAIGN_MODES = ["B0", "B-restart", "B-self"] as const;

export const budgetSchema = z.object({
  maxGenerations: z.int().positive(),
  maxCostUsd: z.number().nonnegative().nullable(),
  maxEvaluations: z.int().positive(),
});

export const spendTotalsSchema = z.object({
  generations: z.int().nonnegative(),
  evaluations: z.int().nonnegative(),
  inputTokens: z.int().nonnegative(),
  outputTokens: z.int().nonnegative(),
  costUsd: z.number().nonnegative(),
  programCpuMs: z.number().nonnegative(),
});

export const iterationSchema = z.object({
  index: z.int().nonnegative(),
  programId: idSchema,
  devSummary: evaluationSummarySchema,
  accepted: z.boolean(),
  reason: z.string(),
});

/**
 * A self-improvement campaign: fixed rules, fixed budget, every iteration
 * kept (accepted or not), and one program selected on the validation split.
 * Test results live outside the campaign record and never feed back in.
 */
export const campaignSchema = z.object({
  schemaVersion: z.literal(CAMPAIGN_SCHEMA_VERSION),
  id: idSchema,
  mode: z.enum(CAMPAIGN_MODES),
  benchmarkVersion: idSchema,
  manifestDigest: digestSchema,
  devSplit: idSchema,
  validationSplit: idSchema,
  seed: z.int().nonnegative(),
  budget: budgetSchema,
  spent: spendTotalsSchema,
  iterations: z.array(iterationSchema),
  /** Program chosen by validation among accepted programs; null until frozen. */
  selectedProgramId: idSchema.nullable(),
  frozen: z.boolean(),
  stopReason: z.string().nullable(),
});

export type PolicyProgram = z.infer<typeof policyProgramSchema>;
export type GenerationSpend = z.infer<typeof generationSpendSchema>;
export type EvaluationSummary = z.infer<typeof evaluationSummarySchema>;
export type ProgramEvaluation = z.infer<typeof programEvaluationSchema>;
export type Budget = z.infer<typeof budgetSchema>;
export type SpendTotals = z.infer<typeof spendTotalsSchema>;
export type CampaignIteration = z.infer<typeof iterationSchema>;
export type Campaign = z.infer<typeof campaignSchema>;
export type CampaignMode = (typeof CAMPAIGN_MODES)[number];
