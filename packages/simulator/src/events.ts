import { type RideRequest } from "@bus20/contracts/scenario";
import { type Stop, type StopKind } from "@bus20/contracts/stops";
import { type Routing } from "./routing.js";
import { type SimulationState, type VehicleState } from "./state.js";

/** Vehicles whose edge ends now become stationary at the edge's destination. */
export const processArrivals = (state: SimulationState): void => {
  for (const vehicle of state.vehicles) {
    if (vehicle.position.kind === "onEdge" && vehicle.position.arrivalTimeMs === state.nowMs) {
      vehicle.position = { kind: "atNode", nodeId: vehicle.position.toNodeId };
    }
  }
};

const board = (state: SimulationState, vehicle: VehicleState, stop: Stop): void => {
  const entry = state.requests.get(stop.requestId);
  if (entry === undefined) {
    throw new Error(`simulator invariant: unknown request "${stop.requestId}"`);
  }
  entry.phase = "onboard";
  entry.pickupTimeMs = state.nowMs;
  vehicle.onboard.push(stop.requestId);
};

const alight = (state: SimulationState, vehicle: VehicleState, stop: Stop): void => {
  const entry = state.requests.get(stop.requestId);
  if (entry?.pickupTimeMs === undefined) {
    throw new Error(`simulator invariant: drop-off before pickup for "${stop.requestId}"`);
  }
  entry.phase = "completed";
  entry.dropoffTimeMs = state.nowMs;
  vehicle.onboard = vehicle.onboard.filter((id) => id !== stop.requestId);
  state.journeys.push({
    requestId: stop.requestId,
    vehicleId: vehicle.id,
    pickupTimeMs: entry.pickupTimeMs,
    dropoffTimeMs: state.nowMs,
  });
};

/** Serves leading stops located at the vehicle's current node, of the given kinds. */
const leadingStopHere = (vehicle: VehicleState, kinds: readonly StopKind[]): Stop | undefined => {
  const [next] = vehicle.stops;
  if (vehicle.position.kind !== "atNode" || next === undefined) {
    return undefined;
  }
  const here = next.nodeId === vehicle.position.nodeId && kinds.includes(next.kind);
  return here ? next : undefined;
};

const serveLeadingStops = (
  state: SimulationState,
  vehicle: VehicleState,
  kinds: readonly StopKind[],
): void => {
  for (
    let next = leadingStopHere(vehicle, kinds);
    next !== undefined;
    next = leadingStopHere(vehicle, kinds)
  ) {
    vehicle.stops.shift();
    if (next.kind === "pickup") {
      board(state, vehicle, next);
    } else {
      alight(state, vehicle, next);
    }
  }
};

/** Committed drop-offs happen before new requests are released and decided. */
export const processDropoffs = (state: SimulationState): void => {
  for (const vehicle of state.vehicles) {
    serveLeadingStops(state, vehicle, ["dropoff"]);
  }
};

/** Marks every request released at the current time as waiting. Returns them in ID order. */
export const releaseRequests = (
  state: SimulationState,
  releases: readonly RideRequest[],
  startIndex: number,
): { readonly released: RideRequest[]; readonly nextIndex: number } => {
  const released: RideRequest[] = [];
  let index = startIndex;
  for (; releases[index]?.requestTimeMs === state.nowMs; index += 1) {
    const request = releases[index];
    const entry = request === undefined ? undefined : state.requests.get(request.id);
    if (request === undefined || entry === undefined) {
      throw new Error(`simulator invariant: unknown release at index ${index}`);
    }
    entry.phase = "waiting";
    released.push(request);
  }
  return { released, nextIndex: index };
};

const depart = (routing: Routing, state: SimulationState, vehicle: VehicleState): void => {
  const [next] = vehicle.stops;
  if (vehicle.position.kind !== "atNode" || next === undefined) {
    return;
  }
  const edge = routing.firstEdge(vehicle.position.nodeId, next.nodeId);
  if (edge === undefined) {
    throw new Error(
      `simulator invariant: no route from "${vehicle.position.nodeId}" to "${next.nodeId}"`,
    );
  }
  vehicle.position = {
    kind: "onEdge",
    edgeId: edge.id,
    fromNodeId: edge.from,
    toNodeId: edge.to,
    arrivalTimeMs: state.nowMs + edge.travelTimeMs,
  };
};

/** Pickups, zero-distance stops, and departures. Empty vehicles wait in place. */
export const processPickupsAndDepartures = (routing: Routing, state: SimulationState): void => {
  for (const vehicle of state.vehicles) {
    serveLeadingStops(state, vehicle, ["pickup", "dropoff"]);
    depart(routing, state, vehicle);
  }
};

/** Earliest pending physical or release event, or undefined when nothing is pending. */
export const nextEventTimeMs = (
  state: SimulationState,
  releases: readonly RideRequest[],
  nextReleaseIndex: number,
): number | undefined => {
  const times = state.vehicles.flatMap((vehicle) =>
    vehicle.position.kind === "onEdge" ? [vehicle.position.arrivalTimeMs] : [],
  );
  const release = releases[nextReleaseIndex];
  if (release !== undefined) {
    times.push(release.requestTimeMs);
  }
  return times.length === 0 ? undefined : Math.min(...times);
};
