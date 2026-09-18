import { type CandidateStop } from "@bus20/contracts/observation";
import { type Stop } from "@bus20/contracts/stops";
import { type Routing } from "./routing.js";
import { type FreePoint, type VehicleState } from "./state.js";

/** Why a stop list is not executable by a vehicle. */
export type PlanDefect = "unreachableStop" | "capacityExceeded" | "stopNotAllowed";

export interface TimedPlan {
  readonly stops: CandidateStop[];
}

export type PlanOutcome = { readonly defect: PlanDefect } | TimedPlan;

export const isPlanDefect = (value: PlanOutcome): value is { readonly defect: PlanDefect } =>
  "defect" in value;

interface Cursor {
  readonly nodeId: string;
  readonly timeMs: number;
  readonly occupancy: number;
}

const advance = (
  routing: Routing,
  capacity: number,
  cursor: Cursor,
  stop: Stop,
): { readonly cursor?: Cursor; readonly defect?: PlanDefect } => {
  if (!routing.stopAllowed(stop.nodeId)) {
    return { defect: "stopNotAllowed" };
  }
  const legMs = routing.travelTimeMs(cursor.nodeId, stop.nodeId);
  if (legMs === undefined) {
    return { defect: "unreachableStop" };
  }
  const occupancy = cursor.occupancy + (stop.kind === "pickup" ? 1 : -1);
  if (occupancy > capacity) {
    return { defect: "capacityExceeded" };
  }
  return { cursor: { nodeId: stop.nodeId, timeMs: cursor.timeMs + legMs, occupancy } };
};

/**
 * Walks a stop list from the vehicle's next free point, checking capacity
 * and reachability and attaching planned arrival times. Stops at the current
 * node take zero time.
 */
export const timePlan = (
  routing: Routing,
  vehicle: VehicleState,
  start: FreePoint,
  stops: readonly Stop[],
): PlanOutcome => {
  const timed: CandidateStop[] = [];
  let cursor: Cursor = { ...start, occupancy: vehicle.onboard.length };
  for (const stop of stops) {
    const next = advance(routing, vehicle.capacity, cursor, stop);
    if (next.cursor === undefined) {
      return { defect: next.defect ?? "unreachableStop" };
    }
    cursor = next.cursor;
    timed.push({ ...stop, plannedArrivalTimeMs: cursor.timeMs });
  }
  return { stops: timed };
};
