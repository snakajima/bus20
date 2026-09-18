import { digestDocument } from "@bus20/contracts/digest";
import { sortIds } from "@bus20/contracts/ids";
import { type SimulationState } from "./state.js";

/** Canonical, JSON-serialisable view of the state used for replay verification. */
export const snapshotState = (state: SimulationState): unknown => ({
  nowMs: state.nowMs,
  stateVersion: state.stateVersion,
  vehicles: state.vehicles.map((vehicle) => ({
    id: vehicle.id,
    position: vehicle.position,
    onboard: vehicle.onboard,
    stops: vehicle.stops,
  })),
  requests: sortIds([...state.requests.keys()]).map((id) => {
    const entry = state.requests.get(id);
    return {
      id,
      phase: entry?.phase ?? "unreleased",
      vehicleId: entry?.vehicleId ?? null,
      pickupTimeMs: entry?.pickupTimeMs ?? null,
      dropoffTimeMs: entry?.dropoffTimeMs ?? null,
    };
  }),
});

export const stateDigest = (state: SimulationState): string => digestDocument(snapshotState(state));
