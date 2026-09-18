import { compareIds } from "@bus20/contracts/ids";
import { type VehiclePosition } from "@bus20/contracts/observation";
import { type Journey } from "@bus20/contracts/run-log";
import {
  type InitialVehicle,
  type RideRequest,
  type ScenarioDocument,
} from "@bus20/contracts/scenario";
import { type Stop } from "@bus20/contracts/stops";

export type RequestPhase = "unreleased" | "waiting" | "assigned" | "onboard" | "completed";

export interface RequestState {
  readonly request: RideRequest;
  phase: RequestPhase;
  vehicleId: string | undefined;
  pickupTimeMs: number | undefined;
  dropoffTimeMs: number | undefined;
}

export interface VehicleState {
  readonly id: string;
  readonly capacity: number;
  position: VehiclePosition;
  /** Request IDs currently on board, in boarding order. */
  onboard: string[];
  /** Remaining committed stops in service order. */
  stops: Stop[];
}

/** Mutable simulator state. Only the simulator package mutates it. */
export interface SimulationState {
  nowMs: number;
  stateVersion: number;
  readonly vehicles: readonly VehicleState[];
  readonly requests: ReadonlyMap<string, RequestState>;
  readonly journeys: Journey[];
}

const initialVehicle = (vehicle: InitialVehicle): VehicleState => ({
  id: vehicle.id,
  capacity: vehicle.capacity,
  position: { kind: "atNode", nodeId: vehicle.nodeId },
  onboard: [],
  stops: [],
});

const initialRequest = (request: RideRequest): RequestState => ({
  request,
  phase: "unreleased",
  vehicleId: undefined,
  pickupTimeMs: undefined,
  dropoffTimeMs: undefined,
});

export const createInitialState = (scenario: ScenarioDocument): SimulationState => ({
  nowMs: scenario.startTimeMs,
  stateVersion: 0,
  vehicles: [...scenario.vehicles]
    .sort((left, right) => compareIds(left.id, right.id))
    .map(initialVehicle),
  requests: new Map(scenario.requests.map((request) => [request.id, initialRequest(request)])),
  journeys: [],
});

export const findVehicle = (state: SimulationState, vehicleId: string): VehicleState | undefined =>
  state.vehicles.find((vehicle) => vehicle.id === vehicleId);

export const allRequestsCompleted = (state: SimulationState): boolean =>
  [...state.requests.values()].every((entry) => entry.phase === "completed");

export interface FreePoint {
  readonly nodeId: string;
  readonly timeMs: number;
}

/** Where and when the vehicle can next change course: its node now, or its edge end. */
export const nextFreePoint = (vehicle: VehicleState, nowMs: number): FreePoint =>
  vehicle.position.kind === "atNode"
    ? { nodeId: vehicle.position.nodeId, timeMs: nowMs }
    : { nodeId: vehicle.position.toNodeId, timeMs: vehicle.position.arrivalTimeMs };
