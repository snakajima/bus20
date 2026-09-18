import {
  type Candidate,
  type Observation,
  type ObservedRequest,
  type ObservedVehicle,
} from "@bus20/contracts/observation";
import { OBSERVATION_SCHEMA_VERSION } from "@bus20/contracts/versions";
import { isPlanDefect, timePlan } from "./plan.js";
import { type Routing } from "./routing.js";
import {
  nextFreePoint,
  type RequestState,
  type SimulationState,
  type VehicleState,
} from "./state.js";

const observeVehicle = (
  routing: Routing,
  nowMs: number,
  vehicle: VehicleState,
): ObservedVehicle => {
  const timed = timePlan(routing, vehicle, nextFreePoint(vehicle, nowMs), vehicle.stops);
  if (isPlanDefect(timed)) {
    throw new Error(`simulator invariant: committed stops of "${vehicle.id}" are ${timed.defect}`);
  }
  return {
    id: vehicle.id,
    capacity: vehicle.capacity,
    position: vehicle.position,
    onboardRequestIds: [...vehicle.onboard],
    stops: timed.stops,
  };
};

const observeRequest = (routing: Routing, entry: RequestState): ObservedRequest | undefined => {
  if (entry.phase === "unreleased" || entry.phase === "completed") {
    return undefined;
  }
  const { request } = entry;
  return {
    id: request.id,
    requestTimeMs: request.requestTimeMs,
    originNodeId: request.originNodeId,
    destinationNodeId: request.destinationNodeId,
    phase: entry.phase,
    directTravelTimeMs: routing.travelTimeMs(request.originNodeId, request.destinationNodeId) ?? 0,
  };
};

const observeRequests = (routing: Routing, state: SimulationState): ObservedRequest[] =>
  [...state.requests.values()].flatMap((entry) => {
    const observed = observeRequest(routing, entry);
    return observed === undefined ? [] : [observed];
  });

const copyCandidate = (candidate: Candidate): Candidate => ({
  ...candidate,
  stops: candidate.stops.map((stop) => ({ ...stop })),
});

/**
 * The legal view of the current state: released, unfinished requests only.
 * Unreleased requests never appear. Candidates come from the host.
 */
export const buildObservation = (
  routing: Routing,
  state: SimulationState,
  scenarioId: string,
  decisionRequestId: string,
  candidates: readonly Candidate[],
): Observation => ({
  schemaVersion: OBSERVATION_SCHEMA_VERSION,
  scenarioId,
  stateVersion: state.stateVersion,
  nowMs: state.nowMs,
  decisionRequestId,
  vehicles: state.vehicles.map((vehicle) => observeVehicle(routing, state.nowMs, vehicle)),
  requests: observeRequests(routing, state),
  candidates: candidates.map(copyCandidate),
});
