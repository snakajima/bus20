import {
  type Action,
  type ActionOutcome,
  type ActionRejectionReason,
} from "@bus20/contracts/action";
import { type Candidate, type CandidateStop } from "@bus20/contracts/observation";
import { type RideRequest } from "@bus20/contracts/scenario";
import { type Stop } from "@bus20/contracts/stops";
import { isPlanDefect, timePlan } from "./plan.js";
import { type Routing } from "./routing.js";
import { findVehicle, nextFreePoint, type SimulationState, type VehicleState } from "./state.js";

export interface AcceptedPlan {
  readonly status: "accepted";
  readonly vehicleId: string;
  readonly stops: CandidateStop[];
}

export type ValidationResult = AcceptedPlan | Extract<ActionOutcome, { status: "rejected" }>;

const reject = (reason: ActionRejectionReason, detail: string): ValidationResult => ({
  status: "rejected",
  reason,
  detail,
});

const sameStop = (left: Stop, right: Stop): boolean =>
  left.requestId === right.requestId && left.kind === right.kind && left.nodeId === right.nodeId;

const stopKey = (stop: Stop): string => `${stop.requestId}/${stop.kind}/${stop.nodeId}`;

const sameSequence = (existing: readonly Stop[], kept: readonly Stop[]): boolean =>
  kept.length === existing.length &&
  kept.every((stop, index) => sameStop(stop, existing[index] ?? stop));

/** Existing commitments must appear unchanged and in the same relative order. */
const checkCommitments = (
  existing: readonly Stop[],
  kept: readonly Stop[],
): ValidationResult | undefined => {
  if (sameSequence(existing, kept)) {
    return undefined;
  }
  const existingKeys = new Set(existing.map(stopKey));
  const foreign = kept.find((stop) => !existingKeys.has(stopKey(stop)));
  if (foreign !== undefined) {
    return reject("unknownRequest", `stop for "${foreign.requestId}" is not this vehicle's`);
  }
  if (kept.length < existing.length) {
    return reject("commitmentDropped", "an existing stop is missing");
  }
  return reject("commitmentReordered", "existing stops changed order");
};

const checkServicePair = (
  request: RideRequest,
  mine: readonly Stop[],
  pickup: Stop,
  dropoff: Stop,
): ValidationResult | undefined => {
  if (pickup.nodeId !== request.originNodeId || dropoff.nodeId !== request.destinationNodeId) {
    return reject("malformed", `stops for "${request.id}" do not match its origin and destination`);
  }
  if (mine.indexOf(pickup) > mine.indexOf(dropoff)) {
    return reject("dropoffBeforePickup", `request "${request.id}" is dropped off before pickup`);
  }
  return undefined;
};

const checkNewService = (
  request: RideRequest,
  mine: readonly Stop[],
): ValidationResult | undefined => {
  const pickups = mine.filter((stop) => stop.kind === "pickup");
  const dropoffs = mine.filter((stop) => stop.kind === "dropoff");
  if (pickups.length > 1 || dropoffs.length > 1) {
    return reject("duplicateService", `request "${request.id}" is served more than once`);
  }
  const [pickup] = pickups;
  const [dropoff] = dropoffs;
  if (pickup === undefined || dropoff === undefined) {
    return reject("missingService", `request "${request.id}" needs one pickup and one drop-off`);
  }
  return checkServicePair(request, mine, pickup, dropoff);
};

const checkPlan = (
  routing: Routing,
  state: SimulationState,
  vehicle: VehicleState,
  stops: readonly Stop[],
): ValidationResult => {
  const timed = timePlan(routing, vehicle, nextFreePoint(vehicle, state.nowMs), stops);
  if (isPlanDefect(timed)) {
    return reject(timed.defect, `stop list is not executable: ${timed.defect}`);
  }
  return { status: "accepted", vehicleId: vehicle.id, stops: timed.stops };
};

const validateInsert = (
  routing: Routing,
  state: SimulationState,
  request: RideRequest,
  vehicleId: string,
  stops: readonly Stop[],
): ValidationResult => {
  const vehicle = findVehicle(state, vehicleId);
  if (vehicle === undefined) {
    return reject("unknownVehicle", `vehicle "${vehicleId}" does not exist`);
  }
  const mine = stops.filter((stop) => stop.requestId === request.id);
  const kept = stops.filter((stop) => stop.requestId !== request.id);
  return (
    checkNewService(request, mine) ??
    checkCommitments(vehicle.stops, kept) ??
    checkPlan(routing, state, vehicle, stops)
  );
};

const validateChoice = (
  candidates: readonly Candidate[],
  candidateId: string,
): ValidationResult => {
  const candidate = candidates.find((item) => item.id === candidateId);
  if (candidate === undefined) {
    return reject("unknownCandidate", `candidate "${candidateId}" is not in the offered set`);
  }
  return { status: "accepted", vehicleId: candidate.vehicleId, stops: candidate.stops };
};

/**
 * Checks an action against the current state. Both action forms go through
 * the same rules; a rejection never changes state.
 */
export const validateAction = (
  routing: Routing,
  state: SimulationState,
  request: RideRequest,
  candidates: readonly Candidate[],
  action: Action,
): ValidationResult => {
  if (action.stateVersion !== state.stateVersion) {
    return reject(
      "staleStateVersion",
      `expected ${state.stateVersion}, got ${action.stateVersion}`,
    );
  }
  return action.kind === "chooseCandidate"
    ? validateChoice(candidates, action.candidateId)
    : validateInsert(routing, state, request, action.vehicleId, action.stops);
};
