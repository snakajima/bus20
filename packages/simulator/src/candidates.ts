import { type Candidate } from "@bus20/contracts/observation";
import { type RideRequest } from "@bus20/contracts/scenario";
import { type Stop } from "@bus20/contracts/stops";
import { isPlanDefect, timePlan } from "./plan.js";
import { type Routing } from "./routing.js";
import { nextFreePoint, type SimulationState, type VehicleState } from "./state.js";

/** Candidate IDs encode vehicle and insertion indices, never cost. */
export const candidateId = (vehicleId: string, pickupIndex: number, dropoffIndex: number): string =>
  `${vehicleId}:${pickupIndex}:${dropoffIndex}`;

const insertAt = <T>(list: readonly T[], index: number, item: T): T[] => [
  ...list.slice(0, index),
  item,
  ...list.slice(index),
];

const requestStops = (request: RideRequest): readonly [Stop, Stop] => [
  { requestId: request.id, kind: "pickup", nodeId: request.originNodeId },
  { requestId: request.id, kind: "dropoff", nodeId: request.destinationNodeId },
];

/** All (pickupIndex, dropoffIndex) pairs with pickup strictly before drop-off. */
const insertionPairs = (count: number): readonly (readonly [number, number])[] => {
  const pairs: (readonly [number, number])[] = [];
  for (let i = 0; i <= count; i += 1) {
    for (let j = i + 1; j <= count + 1; j += 1) {
      pairs.push([i, j]);
    }
  }
  return pairs;
};

const vehicleCandidates = (
  routing: Routing,
  state: SimulationState,
  vehicle: VehicleState,
  request: RideRequest,
): Candidate[] => {
  const [pickup, dropoff] = requestStops(request);
  const start = nextFreePoint(vehicle, state.nowMs);
  return insertionPairs(vehicle.stops.length).flatMap(([i, j]) => {
    const stops = insertAt(insertAt(vehicle.stops, i, pickup), j, dropoff);
    const timed = timePlan(routing, vehicle, start, stops);
    return isPlanDefect(timed)
      ? []
      : [{ id: candidateId(vehicle.id, i, j), vehicleId: vehicle.id, stops: timed.stops }];
  });
};

/**
 * Every legal insertion of the request's pickup and drop-off into one
 * vehicle's remaining stops. Order is (vehicle ID, pickup index, drop-off
 * index) and carries no information about quality.
 */
export const enumerateCandidates = (
  routing: Routing,
  state: SimulationState,
  request: RideRequest,
): Candidate[] =>
  state.vehicles.flatMap((vehicle) => vehicleCandidates(routing, state, vehicle, request));
