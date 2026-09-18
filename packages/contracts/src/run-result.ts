import { z } from "zod";
import { policyDescriptorSchema, runFailureReasonSchema } from "./run-log.js";
import { PROTOCOL_VERSION, RUN_RESULT_SCHEMA_VERSION } from "./versions.js";

const idSchema = z.string().min(1);

/** Per-passenger score in minutes; pain is minutes squared. */
export const passengerScoreSchema = z.object({
  requestId: idSchema,
  waitMinutes: z.number().nonnegative(),
  detourMinutes: z.number().nonnegative(),
  painMinutesSquared: z.number().nonnegative(),
});

export const scoreSummarySchema = z.object({
  meanWaitMinutes: z.number().nonnegative(),
  meanDetourMinutes: z.number().nonnegative(),
  delayP95Minutes: z.number().nonnegative(),
  delayP99Minutes: z.number().nonnegative(),
  maxDelayMinutes: z.number().nonnegative(),
});

const resultBase = {
  schemaVersion: z.literal(RUN_RESULT_SCHEMA_VERSION),
  protocolVersion: z.literal(PROTOCOL_VERSION),
  scenarioId: idSchema,
  policy: policyDescriptorSchema,
  requestCount: z.int().nonnegative(),
  completedCount: z.int().nonnegative(),
};

/**
 * Official score. `pain` is the mean of individual pains in minutes squared.
 * A failed run has `pain: null`, which is conceptually infinite. Never report
 * a mean over the served subset as the run's score.
 */
export const runResultSchema = z.discriminatedUnion("status", [
  z.object({
    ...resultBase,
    status: z.literal("complete"),
    pain: z.number().nonnegative(),
    passengers: z.array(passengerScoreSchema),
    summary: scoreSummarySchema,
  }),
  z.object({
    ...resultBase,
    status: z.literal("failed"),
    pain: z.null(),
    failure: z.object({ reason: runFailureReasonSchema, detail: z.string() }),
  }),
]);

export type PassengerScore = z.infer<typeof passengerScoreSchema>;
export type ScoreSummary = z.infer<typeof scoreSummarySchema>;
export type RunResult = z.infer<typeof runResultSchema>;
