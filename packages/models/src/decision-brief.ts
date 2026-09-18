import { type JsonValue } from "@bus20/contracts/json-value";
import { type Candidate, type Observation } from "@bus20/contracts/observation";
import { msToMinutes } from "@bus20/contracts/time";

/**
 * Prompt version. Bump whenever the brief's wording or structure changes;
 * results across versions must not be pooled.
 */
export const PROMPT_VERSION = "bus20-prompt/1" as const;

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

const minutes = (ms: number): number => Number(msToMinutes(ms).toFixed(3));

const briefStops = (candidate: Candidate): JsonValue[] =>
  candidate.stops.map((stop) => ({
    requestId: stop.requestId,
    kind: stop.kind,
    nodeId: stop.nodeId,
    arrivalMinutes: minutes(stop.plannedArrivalTimeMs),
  }));

const briefVehicles = (observation: Observation): JsonValue[] =>
  observation.vehicles.map((vehicle) => ({
    id: vehicle.id,
    capacity: vehicle.capacity,
    onboardRequestIds: [...vehicle.onboardRequestIds],
    position:
      vehicle.position.kind === "atNode"
        ? { kind: "atNode", nodeId: vehicle.position.nodeId }
        : {
            kind: "onEdge",
            toNodeId: vehicle.position.toNodeId,
            arrivalMinutes: minutes(vehicle.position.arrivalTimeMs),
          },
    committedStops: vehicle.stops.map((stop) => ({
      requestId: stop.requestId,
      kind: stop.kind,
      nodeId: stop.nodeId,
      arrivalMinutes: minutes(stop.plannedArrivalTimeMs),
    })),
  }));

const briefRequests = (observation: Observation): JsonValue[] =>
  observation.requests.map((request) => ({
    id: request.id,
    requestMinutes: minutes(request.requestTimeMs),
    originNodeId: request.originNodeId,
    destinationNodeId: request.destinationNodeId,
    phase: request.phase,
    directTravelMinutes: minutes(request.directTravelTimeMs),
  }));

/** Summary of one candidate, also used as the option description for Jev. */
export const describeCandidate = (candidate: Candidate): Record<string, JsonValue> => ({
  vehicleId: candidate.vehicleId,
  stops: briefStops(candidate),
});

/**
 * Provider-neutral decision state. Every model receives exactly this object
 * (as Jev state or as the LLM user message) so that no adapter carries extra
 * information. Times are minutes for readability; the host keeps milliseconds.
 */
export const buildDecisionBrief = (observation: Observation): Record<string, JsonValue> => ({
  promptVersion: PROMPT_VERSION,
  objective: OBJECTIVE_TEXT,
  nowMinutes: minutes(observation.nowMs),
  decisionRequestId: observation.decisionRequestId,
  vehicles: briefVehicles(observation),
  requests: briefRequests(observation),
  candidates: observation.candidates.map((candidate) => ({
    id: candidate.id,
    ...describeCandidate(candidate),
  })),
});

export const candidateIds = (observation: Observation): string[] =>
  observation.candidates.map((candidate) => candidate.id);

/** Fails loudly instead of pruning candidates when the choice set is too large. */
export const assertChoiceFits = (observation: Observation): void => {
  if (observation.candidates.length === 0) {
    throw new Error("no legal candidates were offered");
  }
  if (observation.candidates.length > MAX_CHOICE_OPTIONS) {
    throw new Error(
      `${observation.candidates.length} candidates exceed the ${MAX_CHOICE_OPTIONS}-option limit`,
    );
  }
};
