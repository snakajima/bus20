import { z } from "zod";
import { stopSchema } from "./stops.js";
import { OBSERVATION_SCHEMA_VERSION } from "./versions.js";

const idSchema = z.string().min(1);
const timestampSchema = z.int().nonnegative();

/** A vehicle is either stationary at a node or committed to its current edge. */
export const vehiclePositionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("atNode"), nodeId: idSchema }),
  z.object({
    kind: z.literal("onEdge"),
    edgeId: idSchema,
    fromNodeId: idSchema,
    toNodeId: idSchema,
    arrivalTimeMs: timestampSchema,
  }),
]);

/** A planned stop with its host-computed arrival time along the route. */
export const candidateStopSchema = stopSchema.extend({ plannedArrivalTimeMs: timestampSchema });

export const observedVehicleSchema = z.object({
  id: idSchema,
  capacity: z.int().positive(),
  position: vehiclePositionSchema,
  onboardRequestIds: z.array(idSchema),
  /** Remaining committed stops in service order, with planned arrival times. */
  stops: z.array(candidateStopSchema),
});

export const REQUEST_PHASES = ["waiting", "assigned", "onboard", "completed"] as const;
export const requestPhaseSchema = z.enum(REQUEST_PHASES);

/** A released request. Unreleased requests never appear in an observation. */
export const observedRequestSchema = z.object({
  id: idSchema,
  requestTimeMs: timestampSchema,
  originNodeId: idSchema,
  destinationNodeId: idSchema,
  phase: requestPhaseSchema,
  /** Shortest direct travel time on the fixed graph, ms. */
  directTravelTimeMs: z.int().nonnegative(),
});

/**
 * A legal insertion candidate. It carries the complete remaining stop list of
 * one vehicle. Candidates never carry pain, cost, or a cost-based rank, and
 * their order is fixed by (vehicleId, candidate id) rather than quality.
 */
export const candidateSchema = z.object({
  id: idSchema,
  vehicleId: idSchema,
  stops: z.array(candidateStopSchema).min(1),
});

export const observationSchema = z.object({
  schemaVersion: z.literal(OBSERVATION_SCHEMA_VERSION),
  scenarioId: idSchema,
  /** Monotonic state version; actions must name the version they were decided on. */
  stateVersion: z.int().nonnegative(),
  nowMs: timestampSchema,
  /** The request whose pickup and drop-off must be inserted by this decision. */
  decisionRequestId: idSchema,
  vehicles: z.array(observedVehicleSchema).min(1),
  requests: z.array(observedRequestSchema),
  candidates: z.array(candidateSchema),
});

export type VehiclePosition = z.infer<typeof vehiclePositionSchema>;
export type ObservedVehicle = z.infer<typeof observedVehicleSchema>;
export type RequestPhase = z.infer<typeof requestPhaseSchema>;
export type ObservedRequest = z.infer<typeof observedRequestSchema>;
export type CandidateStop = z.infer<typeof candidateStopSchema>;
export type Candidate = z.infer<typeof candidateSchema>;
export type Observation = z.infer<typeof observationSchema>;
