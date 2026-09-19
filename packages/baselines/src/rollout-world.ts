import { type Candidate, type CandidateStop, type Observation } from "@bus20/contracts/observation";
import { type Stop } from "@bus20/contracts/stops";
import { isPlanDefect, timePlan } from "@bus20/simulator/plan";
import { type Routing } from "@bus20/simulator/routing";
import { type FreePoint } from "@bus20/simulator/state";
import { planCostMs2, type RequestTiming, type TimingLookup } from "./insertion-rule.js";

/**
 * A light, deterministic forward model used inside rollouts. Vehicles follow
 * shortest paths and may re-plan at the end of the edge they are on, pickups
 * and drop-offs happen at their planned times, and new requests are inserted
 * greedily by the insertion rule. It approximates the simulator closely
 * enough to rank candidates and is never used for scoring.
 */
export interface WorldRequest extends RequestTiming {
  readonly id: string;
  readonly originNodeId: string;
  readonly destinationNodeId: string;
}

export interface WorldVehicle {
  readonly id: string;
  readonly capacity: number;
  free: FreePoint;
  onboard: string[];
  stops: Stop[];
}

export interface World {
  readonly vehicles: WorldVehicle[];
  readonly requests: Map<string, WorldRequest>;
  /** Drop-off times of passengers already served inside the rollout. */
  readonly served: Map<string, number>;
}

const plainStop = (stop: Stop): Stop => ({
  requestId: stop.requestId,
  kind: stop.kind,
  nodeId: stop.nodeId,
});

const freePointOf = (
  observation: Observation,
  vehicle: Observation["vehicles"][number],
): FreePoint =>
  vehicle.position.kind === "atNode"
    ? { nodeId: vehicle.position.nodeId, timeMs: observation.nowMs }
    : { nodeId: vehicle.position.toNodeId, timeMs: vehicle.position.arrivalTimeMs };

/** The observed state with one candidate committed. */
export const worldFromObservation = (observation: Observation, candidate: Candidate): World => ({
  vehicles: observation.vehicles.map((vehicle) => ({
    id: vehicle.id,
    capacity: vehicle.capacity,
    free: freePointOf(observation, vehicle),
    onboard: [...vehicle.onboardRequestIds],
    stops: (vehicle.id === candidate.vehicleId ? candidate.stops : vehicle.stops).map(plainStop),
  })),
  requests: new Map(observation.requests.map((request) => [request.id, { ...request }])),
  served: new Map(),
});

export const timingOf =
  (world: World): TimingLookup =>
  (requestId) => {
    const request = world.requests.get(requestId);
    if (request === undefined) {
      throw new Error(`rollout world has no request "${requestId}"`);
    }
    return request;
  };

/** Timed remaining plan of a vehicle from its free point, or undefined when infeasible. */
export const timedPlan = (
  routing: Routing,
  vehicle: WorldVehicle,
  stops: readonly Stop[],
): CandidateStop[] | undefined => {
  const shape = { ...vehicle, position: { kind: "atNode" as const, nodeId: vehicle.free.nodeId } };
  const timed = timePlan(routing, shape, vehicle.free, stops);
  return isPlanDefect(timed) ? undefined : timed.stops;
};

const serve = (world: World, vehicle: WorldVehicle, stop: CandidateStop): void => {
  if (stop.kind === "pickup") {
    vehicle.onboard.push(stop.requestId);
    return;
  }
  vehicle.onboard = vehicle.onboard.filter((id) => id !== stop.requestId);
  world.served.set(stop.requestId, stop.plannedArrivalTimeMs);
};

const advanceVehicle = (routing: Routing, world: World, vehicle: WorldVehicle, nowMs: number) => {
  const timed = timedPlan(routing, vehicle, vehicle.stops);
  if (timed === undefined) {
    throw new Error(`rollout invariant: plan of "${vehicle.id}" became infeasible`);
  }
  const done = timed.filter((stop) => stop.plannedArrivalTimeMs <= nowMs);
  for (const stop of done) {
    serve(world, vehicle, stop);
  }
  const next = timed[done.length];
  vehicle.stops = vehicle.stops.slice(done.length);
  const last = done[done.length - 1];
  const from: FreePoint =
    last === undefined ? vehicle.free : { nodeId: last.nodeId, timeMs: last.plannedArrivalTimeMs };
  vehicle.free =
    next === undefined
      ? { nodeId: from.nodeId, timeMs: Math.max(nowMs, from.timeMs) }
      : freePointAlong(routing, from, next.nodeId, nowMs);
};

/**
 * Where a vehicle heading from `from` to `toNodeId` can next change course at
 * `nowMs`: it finishes the edge it is on, as in the simulator, but is not
 * committed beyond that.
 */
const freePointAlong = (
  routing: Routing,
  from: FreePoint,
  toNodeId: string,
  nowMs: number,
): FreePoint => {
  let cursor = from;
  while (cursor.timeMs < nowMs && cursor.nodeId !== toNodeId) {
    const edge = routing.firstEdge(cursor.nodeId, toNodeId);
    if (edge === undefined) {
      return cursor;
    }
    cursor = { nodeId: edge.to, timeMs: cursor.timeMs + edge.travelTimeMs };
  }
  return cursor;
};

/** Serves every stop due by `nowMs`; moving vehicles finish their current edge first. */
export const advanceWorld = (routing: Routing, world: World, nowMs: number): void => {
  for (const vehicle of world.vehicles) {
    advanceVehicle(routing, world, vehicle, nowMs);
  }
};

const insertAt = <T>(list: readonly T[], index: number, item: T): T[] => [
  ...list.slice(0, index),
  item,
  ...list.slice(index),
];

interface Insertion {
  readonly vehicle: WorldVehicle;
  readonly stops: Stop[];
  readonly costMs2: number;
}

const requestStops = (request: WorldRequest): readonly [Stop, Stop] => [
  { requestId: request.id, kind: "pickup", nodeId: request.originNodeId },
  { requestId: request.id, kind: "dropoff", nodeId: request.destinationNodeId },
];

/** Every (pickup, drop-off) insertion of the request into the vehicle's stops, pickup first. */
const insertions = (vehicle: WorldVehicle, request: WorldRequest): Stop[][] => {
  const [pickup, dropoff] = requestStops(request);
  const lists: Stop[][] = [];
  for (let i = 0; i <= vehicle.stops.length; i += 1) {
    for (let j = i + 1; j <= vehicle.stops.length + 1; j += 1) {
      lists.push(insertAt(insertAt(vehicle.stops, i, pickup), j, dropoff));
    }
  }
  return lists;
};

const cheaper = (found: Insertion | undefined, best: Insertion | undefined) =>
  found !== undefined && (best === undefined || found.costMs2 < best.costMs2) ? found : best;

const bestInsertionInto = (
  routing: Routing,
  world: World,
  vehicle: WorldVehicle,
  request: WorldRequest,
): Insertion | undefined => {
  const timing = timingOf(world);
  const current = timedPlan(routing, vehicle, vehicle.stops);
  const basis = current === undefined ? 0 : planCostMs2(current, timing);
  let best: Insertion | undefined;
  for (const stops of insertions(vehicle, request)) {
    const timed = timedPlan(routing, vehicle, stops);
    const found =
      timed === undefined
        ? undefined
        : { vehicle, stops, costMs2: planCostMs2(timed, timing) - basis };
    best = cheaper(found, best);
  }
  return best;
};

/** Inserts a newly released request where it adds the least squared delay (the insertion rule). */
export const insertGreedily = (routing: Routing, world: World, request: WorldRequest): boolean => {
  world.requests.set(request.id, request);
  let best: Insertion | undefined;
  for (const vehicle of world.vehicles) {
    best = cheaper(bestInsertionInto(routing, world, vehicle, request), best);
  }
  if (best === undefined) {
    return false;
  }
  best.vehicle.stops = best.stops;
  return true;
};

/** Squared delay of every passenger served so far plus every one still planned. */
export const totalCostMs2 = (routing: Routing, world: World): number => {
  const timing = timingOf(world);
  let total = 0;
  for (const [requestId, dropoffMs] of world.served) {
    total += planCostMs2(
      [{ requestId, kind: "dropoff", nodeId: "", plannedArrivalTimeMs: dropoffMs }],
      timing,
    );
  }
  for (const vehicle of world.vehicles) {
    const timed = timedPlan(routing, vehicle, vehicle.stops);
    total += timed === undefined ? 0 : planCostMs2(timed, timing);
  }
  return total;
};
