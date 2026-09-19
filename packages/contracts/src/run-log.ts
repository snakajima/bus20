import { z } from "zod";
import { actionOutcomeSchema, actionSchema } from "./action.js";
import { jsonValueSchema } from "./json-value.js";
import { PROTOCOL_VERSION, RUN_LOG_SCHEMA_VERSION } from "./versions.js";

const idSchema = z.string().min(1);
const timestampSchema = z.int().nonnegative();
const digestSchema = z.string().regex(/^sha256:[0-9a-f]{64}$/);

/**
 * Which kind of decision-maker produced a run. The offline fixture policy is
 * a smoke-test baseline only and must never be presented as Swift or as AI.
 */
export const POLICY_KINDS = [
  "swift-reference",
  "rollout-reference",
  "random-reference",
  "general-llm",
  "jev",
  "fixture",
  "generated-program",
] as const;
export const GENERAL_LLM_PROVIDERS = ["anthropic", "openai", "google"] as const;
export const policyKindSchema = z.enum(POLICY_KINDS);

export const policyDescriptorSchema = z.object({
  id: idSchema,
  kind: policyKindSchema,
  /** Exact model identifier, never a moving alias. Omitted for non-model policies. */
  modelId: z.string().min(1).optional(),
  provider: z.string().min(1).optional(),
  promptVersion: z.string().min(1).optional(),
  toolVersion: z.string().min(1).optional(),
  /** Provider-side settings that change behaviour (effort, retries, timeouts). */
  settings: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

/** Completed passenger journey. Times are virtual milliseconds. */
export const journeySchema = z.object({
  requestId: idSchema,
  vehicleId: idSchema,
  pickupTimeMs: timestampSchema,
  dropoffTimeMs: timestampSchema,
});

export const decisionRecordSchema = z.object({
  stateVersion: z.int().nonnegative(),
  nowMs: timestampSchema,
  requestId: idSchema,
  action: actionSchema,
  outcome: actionOutcomeSchema,
  /** Wall-clock latency of the policy call. Never added to virtual time. */
  wallLatencyMs: z.number().nonnegative(),
  /** Numeric accounting: tokens, cost, confidence, host computation. */
  usage: z.record(z.string(), z.number()).optional(),
  /** Provider request/response material kept so the run can be re-scored without the API. */
  trace: z.record(z.string(), jsonValueSchema).optional(),
});

export const RUN_FAILURE_REASONS = [
  "deadlineExceeded",
  "invalidAction",
  "budgetExceeded",
  "policyError",
  "unservedRequests",
  "inconsistentLog",
] as const;
export const runFailureReasonSchema = z.enum(RUN_FAILURE_REASONS);

export const runTerminationSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("drained"), finalTimeMs: timestampSchema }),
  z.object({
    kind: z.literal("failed"),
    finalTimeMs: timestampSchema,
    reason: runFailureReasonSchema,
    detail: z.string(),
  }),
]);

/** Everything the scorer needs to grade a run without trusting the policy. */
export const runLogSchema = z.object({
  schemaVersion: z.literal(RUN_LOG_SCHEMA_VERSION),
  protocolVersion: z.literal(PROTOCOL_VERSION),
  scenarioId: idSchema,
  scenarioDigest: digestSchema,
  mapDigest: digestSchema,
  policy: policyDescriptorSchema,
  termination: runTerminationSchema,
  journeys: z.array(journeySchema),
  decisions: z.array(decisionRecordSchema),
  /** Digest of the final simulator state; replay must reproduce it exactly. */
  finalStateDigest: digestSchema.optional(),
});

export type PolicyKind = z.infer<typeof policyKindSchema>;
export type PolicyDescriptor = z.infer<typeof policyDescriptorSchema>;
export type Journey = z.infer<typeof journeySchema>;
export type DecisionRecord = z.infer<typeof decisionRecordSchema>;
export type RunFailureReason = z.infer<typeof runFailureReasonSchema>;
export type RunTermination = z.infer<typeof runTerminationSchema>;
export type RunLog = z.infer<typeof runLogSchema>;
