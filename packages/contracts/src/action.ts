import { z } from "zod";
import { stopSchema } from "./stops.js";
import { ACTION_SCHEMA_VERSION } from "./versions.js";

const idSchema = z.string().min(1);

/**
 * Policy output. Either pick a host-enumerated candidate by ID or state the
 * full remaining stop list for one vehicle. Both forms are validated by the
 * host against the same rules before they change state.
 */
export const actionSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("chooseCandidate"),
    schemaVersion: z.literal(ACTION_SCHEMA_VERSION),
    stateVersion: z.int().nonnegative(),
    candidateId: idSchema,
  }),
  z.object({
    kind: z.literal("insert"),
    schemaVersion: z.literal(ACTION_SCHEMA_VERSION),
    stateVersion: z.int().nonnegative(),
    vehicleId: idSchema,
    stops: z.array(stopSchema).min(2),
  }),
]);

export type Action = z.infer<typeof actionSchema>;

/** Why the host rejected an action. Rejections never mutate state. */
export const ACTION_REJECTION_REASONS = [
  "staleStateVersion",
  "unknownCandidate",
  "unknownVehicle",
  "unknownRequest",
  "unreachableStop",
  "capacityExceeded",
  "dropoffBeforePickup",
  "duplicateService",
  "missingService",
  "commitmentReordered",
  "commitmentDropped",
  "stopNotAllowed",
  "malformed",
] as const;
export const actionRejectionReasonSchema = z.enum(ACTION_REJECTION_REASONS);
export type ActionRejectionReason = z.infer<typeof actionRejectionReasonSchema>;

export const actionOutcomeSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("accepted") }),
  z.object({
    status: z.literal("rejected"),
    reason: actionRejectionReasonSchema,
    detail: z.string(),
  }),
]);
export type ActionOutcome = z.infer<typeof actionOutcomeSchema>;
