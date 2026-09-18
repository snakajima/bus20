import { type JsonValue } from "@bus20/contracts/json-value";
import {
  type Candidate,
  type CandidateStop,
  type Observation,
  type ObservedVehicle,
} from "@bus20/contracts/observation";
import { msToMinutes } from "@bus20/contracts/time";

/**
 * Prompt version. Bump whenever the brief's wording or structure changes;
 * results across versions must not be pooled. Version 2 encodes candidates
 * compactly (insertion indices plus the timing consequences) instead of
 * repeating every vehicle's full stop list per candidate.
 */
export const PROMPT_VERSION = "bus20-prompt/2" as const;

/** Jev's Choice primitive accepts at most this many options. */
export const MAX_CHOICE_OPTIONS = 255;

export const OBJECTIVE_TEXT =
  "You dispatch a small fleet of shared shuttles on a fixed road network. " +
  "One new passenger has just requested a ride. Choose exactly one of the offered " +
  "candidates. Each candidate inserts the new passenger's pickup and drop-off into " +
  "one vehicle's remaining stop list; existing stops keep their order. The benchmark " +
  "score is the mean over all passengers of (waitMinutes + detourMinutes)^2, where " +
  "wait is pickup minus request time and detour is ride time minus the direct travel " +
  "time. Lower is better. Every passenger must eventually be served; unserved " +
  "passengers fail the whole run. Candidates are listed in a fixed order that says " +
  "nothing about their quality. Future requests are unknown.";

export const CANDIDATE_ENCODING_TEXT =
  "A candidate is described by the vehicle, the positions at which the new passenger's " +
  "pickup and drop-off are inserted into that vehicle's committed stop list (0 = before " +
  "the first committed stop), the new passenger's planned pickup and drop-off times, and " +
  "how much later the vehicle's existing stops become: shiftBetweenMinutes applies to " +
  "committed stops between the two insertions, shiftAfterMinutes to committed stops after " +
  "the drop-off. Committed stops before the pickup are unaffected.";

const minutes = (ms: number): number => Number(msToMinutes(ms).toFixed(3));

const briefStops = (stops: readonly CandidateStop[]): JsonValue[] =>
  stops.map((stop) => ({
    requestId: stop.requestId,
    kind: stop.kind,
    nodeId: stop.nodeId,
    arrivalMinutes: minutes(stop.plannedArrivalTimeMs),
  }));

const briefPosition = (vehicle: ObservedVehicle): JsonValue =>
  vehicle.position.kind === "atNode"
    ? { kind: "atNode", nodeId: vehicle.position.nodeId }
    : {
        kind: "onEdge",
        toNodeId: vehicle.position.toNodeId,
        arrivalMinutes: minutes(vehicle.position.arrivalTimeMs),
      };

export const briefVehicle = (vehicle: ObservedVehicle): Record<string, JsonValue> => ({
  id: vehicle.id,
  capacity: vehicle.capacity,
  onboardRequestIds: [...vehicle.onboardRequestIds],
  position: briefPosition(vehicle),
  committedStops: briefStops(vehicle.stops),
});

const briefRequests = (observation: Observation): JsonValue[] =>
  observation.requests.map((request) => ({
    id: request.id,
    requestMinutes: minutes(request.requestTimeMs),
    originNodeId: request.originNodeId,
    destinationNodeId: request.destinationNodeId,
    phase: request.phase,
    directTravelMinutes: minutes(request.directTravelTimeMs),
  }));

/** Insertion indices encoded in a candidate ID (`vehicle:pickupIndex:dropoffIndex`). */
export const insertionIndices = (candidate: Candidate): { pickup: number; dropoff: number } => {
  const parts = candidate.id.split(":");
  const pickup = Number(parts[parts.length - 2]);
  const dropoff = Number(parts[parts.length - 1]);
  if (!Number.isInteger(pickup) || !Number.isInteger(dropoff)) {
    throw new Error(`candidate id "${candidate.id}" does not encode insertion indices`);
  }
  return { pickup, dropoff };
};

/** Shift of the first committed stop in a candidate index range, or null when the range is empty. */
const shiftMinutes = (
  candidate: Candidate,
  vehicle: ObservedVehicle,
  from: number,
  to: number,
  removed: number,
): number | null => {
  const stop = candidate.stops[from];
  const original = vehicle.stops[from - removed];
  if (from >= to || stop === undefined || original === undefined) {
    return null;
  }
  return minutes(stop.plannedArrivalTimeMs - original.plannedArrivalTimeMs);
};

/**
 * Compact candidate: O(1) numbers per candidate instead of a full stop list.
 * Under fixed travel times, every committed stop between the two insertions
 * is delayed by one constant and every stop after the drop-off by another,
 * so two shifts describe the whole consequence for existing passengers.
 */
export const describeCandidate = (
  observation: Observation,
  candidate: Candidate,
): Record<string, JsonValue> => {
  const vehicle = observation.vehicles.find((item) => item.id === candidate.vehicleId);
  if (vehicle === undefined) {
    throw new Error(`candidate "${candidate.id}" names unknown vehicle "${candidate.vehicleId}"`);
  }
  const { pickup, dropoff } = insertionIndices(candidate);
  return {
    vehicleId: candidate.vehicleId,
    pickupIndex: pickup,
    dropoffIndex: dropoff,
    pickupMinutes: minutes(stopAt(candidate, pickup).plannedArrivalTimeMs),
    dropoffMinutes: minutes(stopAt(candidate, dropoff).plannedArrivalTimeMs),
    shiftBetweenMinutes: shiftMinutes(candidate, vehicle, pickup + 1, dropoff, 1),
    shiftAfterMinutes: shiftMinutes(candidate, vehicle, dropoff + 1, candidate.stops.length, 2),
  };
};

const stopAt = (candidate: Candidate, index: number): CandidateStop => {
  const stop = candidate.stops[index];
  if (stop === undefined) {
    throw new Error(`candidate "${candidate.id}" is shorter than its insertion indices`);
  }
  return stop;
};

/**
 * Provider-neutral decision state without candidates: the objective, the
 * clock, the deciding request, released requests, and every vehicle with its
 * committed stops listed exactly once.
 */
export const buildDecisionState = (observation: Observation): Record<string, JsonValue> => ({
  promptVersion: PROMPT_VERSION,
  objective: OBJECTIVE_TEXT,
  candidateEncoding: CANDIDATE_ENCODING_TEXT,
  nowMinutes: minutes(observation.nowMs),
  decisionRequestId: observation.decisionRequestId,
  vehicles: observation.vehicles.map(briefVehicle),
  requests: briefRequests(observation),
});

/** Full brief with every candidate, for the flat choice. */
export const buildDecisionBrief = (observation: Observation): Record<string, JsonValue> => ({
  ...buildDecisionState(observation),
  candidates: observation.candidates.map((candidate) => ({
    id: candidate.id,
    ...describeCandidate(observation, candidate),
  })),
});

export const candidateIds = (observation: Observation): string[] =>
  observation.candidates.map((candidate) => candidate.id);

/** Fails loudly instead of pruning options when a choice set is too large. */
export const assertChoiceFits = (count: number, label: string): void => {
  if (count === 0) {
    throw new Error(`no legal ${label} were offered`);
  }
  if (count > MAX_CHOICE_OPTIONS) {
    throw new Error(`${count} ${label} exceed the ${MAX_CHOICE_OPTIONS}-option limit`);
  }
};
