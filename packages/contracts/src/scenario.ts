import { z } from "zod";
import { compareIds, findDuplicateIds } from "./ids.js";
import { validateWithSchema } from "./json.js";
import { fail, issue, type Issue, ok, type Result } from "./result.js";
import { SCENARIO_SCHEMA_VERSION } from "./versions.js";

const idSchema = z.string().min(1);
const timestampSchema = z.int().nonnegative();

/** v1: one request is one passenger. */
export const PASSENGERS_PER_REQUEST = 1 as const;

export const rideRequestSchema = z.object({
  id: idSchema,
  requestTimeMs: timestampSchema,
  originNodeId: idSchema,
  destinationNodeId: idSchema,
  passengers: z.literal(PASSENGERS_PER_REQUEST),
});

export const initialVehicleSchema = z.object({
  id: idSchema,
  nodeId: idSchema,
  capacity: z.int().positive(),
});

/** Content digest of the map the scenario was generated against. */
export const mapReferenceSchema = z.object({
  id: idSchema,
  digest: z.string().regex(/^sha256:[0-9a-f]{64}$/),
});

export const scenarioDocumentSchema = z.object({
  schemaVersion: z.literal(SCENARIO_SCHEMA_VERSION),
  id: idSchema,
  map: mapReferenceSchema,
  startTimeMs: timestampSchema,
  demandEndTimeMs: timestampSchema,
  completionDeadlineMs: timestampSchema,
  vehicles: z.array(initialVehicleSchema).min(1),
  requests: z.array(rideRequestSchema).min(1),
  /** Free-form provenance (generator version, seed, demand pattern). */
  provenance: z.record(z.string(), z.string()).optional(),
});

export type RideRequest = z.infer<typeof rideRequestSchema>;
export type InitialVehicle = z.infer<typeof initialVehicleSchema>;
export type MapReference = z.infer<typeof mapReferenceSchema>;
export type ScenarioDocument = z.infer<typeof scenarioDocumentSchema>;

const checkTimeline = (scenario: ScenarioDocument): Issue[] => {
  const issues: Issue[] = [];
  if (scenario.demandEndTimeMs < scenario.startTimeMs) {
    issues.push(issue("demandEndTimeMs", "must not precede startTimeMs"));
  }
  if (scenario.completionDeadlineMs < scenario.demandEndTimeMs) {
    issues.push(issue("completionDeadlineMs", "must not precede demandEndTimeMs"));
  }
  return issues;
};

const checkRequest = (scenario: ScenarioDocument, request: RideRequest, index: number): Issue[] => {
  const issues: Issue[] = [];
  const path = `requests.${index}`;
  if (request.originNodeId === request.destinationNodeId) {
    issues.push(issue(path, `request "${request.id}" has identical origin and destination`));
  }
  if (
    request.requestTimeMs < scenario.startTimeMs ||
    request.requestTimeMs > scenario.demandEndTimeMs
  ) {
    issues.push(issue(`${path}.requestTimeMs`, "outside [startTimeMs, demandEndTimeMs]"));
  }
  return issues;
};

/** Semantic checks: unique IDs, ordered timeline, requests inside the demand window. */
export const checkScenarioSemantics = (scenario: ScenarioDocument): Issue[] => [
  ...findDuplicateIds(scenario.vehicles.map((v) => v.id)).map((id) =>
    issue("vehicles", `duplicate vehicle id "${id}"`),
  ),
  ...findDuplicateIds(scenario.requests.map((r) => r.id)).map((id) =>
    issue("requests", `duplicate request id "${id}"`),
  ),
  ...checkTimeline(scenario),
  ...scenario.requests.flatMap((request, index) => checkRequest(scenario, request, index)),
];

/** Release order: by request time, then by ID. This is the processing order. */
export const compareRequestsByRelease = (left: RideRequest, right: RideRequest): number =>
  left.requestTimeMs - right.requestTimeMs || compareIds(left.id, right.id);

export const sortRequestsByRelease = (requests: readonly RideRequest[]): RideRequest[] =>
  [...requests].sort(compareRequestsByRelease);

export const validateScenarioDocument = (value: unknown): Result<ScenarioDocument> => {
  const parsed = validateWithSchema(scenarioDocumentSchema, value);
  if (!parsed.ok) {
    return parsed;
  }
  const issues = checkScenarioSemantics(parsed.value);
  return issues.length === 0 ? ok(parsed.value) : fail(issues);
};
