import { type JsonValue } from "@bus20/contracts/json-value";
import {
  type Candidate,
  type Observation,
  type ObservedVehicle,
} from "@bus20/contracts/observation";
import { MS_PER_MINUTE } from "@bus20/contracts/time";
import { type ChoiceOption } from "./choice-client.js";
import { insertionIndices } from "./decision-brief.js";

/**
 * Jev-specific presentation, versioned separately from the shared brief.
 * It carries the same information as `bus20-prompt/2` but follows the
 * TypeSafe guidance for System One models: arithmetic done in code, whole
 * minutes instead of decimals, consequences instead of ingredients, the
 * same named fields on every option, and a state filtered to what the
 * question needs.
 */
export const JEV_PROMPT_VERSION = "bus20-jev-prompt/1" as const;

export const JEV_CANDIDATE_INSTRUCTIONS = {
  task:
    "Pick the candidate that keeps the total of squared delay minutes across all passengers smallest. " +
    "A passenger's delay is their wait plus their detour. Because each delay is squared, one large delay " +
    "hurts much more than several small ones.",
  how_to_read_options:
    "Every option lists the vehicle, the new passenger's wait and detour in minutes, and which passengers " +
    "already assigned to that vehicle get delayed and by how many minutes.",
  note: "Options are listed in a fixed order that says nothing about their quality.",
} as const;

export const JEV_VEHICLE_INSTRUCTIONS = {
  task:
    "Pick the vehicle that should serve the new passenger. The next question will offer that vehicle's " +
    "insertion positions. Prefer a vehicle that can pick the passenger up soon without delaying others much.",
  note: "Options are listed in a fixed order that says nothing about their quality.",
} as const;

const wholeMinutes = (ms: number): number => Math.round(ms / MS_PER_MINUTE);

export interface DelayedPassenger {
  readonly requestId: string;
  readonly extraMinutes: number;
}

export interface Consequences {
  readonly waitMinutes: number;
  readonly detourMinutes: number;
  readonly othersDelayed: readonly DelayedPassenger[];
}

const requestOf = (observation: Observation, requestId: string) => {
  const request = observation.requests.find((item) => item.id === requestId);
  if (request === undefined) {
    throw new Error(`observation has no request "${requestId}"`);
  }
  return request;
};

/** Existing passengers whose drop-off moves later under the candidate, computed in code. */
const delayedPassengers = (vehicle: ObservedVehicle, candidate: Candidate): DelayedPassenger[] => {
  const original = new Map(
    vehicle.stops.flatMap((stop) =>
      stop.kind === "dropoff" ? [[stop.requestId, stop.plannedArrivalTimeMs] as const] : [],
    ),
  );
  return candidate.stops.flatMap((stop) => {
    const before = original.get(stop.requestId);
    if (stop.kind !== "dropoff" || before === undefined) {
      return [];
    }
    const extraMinutes = wholeMinutes(stop.plannedArrivalTimeMs - before);
    return extraMinutes > 0 ? [{ requestId: stop.requestId, extraMinutes }] : [];
  });
};

/** Exact consequences of a candidate for the new passenger and for existing ones. */
export const consequencesOf = (observation: Observation, candidate: Candidate): Consequences => {
  const vehicle = observation.vehicles.find((item) => item.id === candidate.vehicleId);
  if (vehicle === undefined) {
    throw new Error(`candidate "${candidate.id}" names unknown vehicle "${candidate.vehicleId}"`);
  }
  const request = requestOf(observation, observation.decisionRequestId);
  const { pickup, dropoff } = insertionIndices(candidate);
  const pickupMs = candidate.stops[pickup]?.plannedArrivalTimeMs ?? 0;
  const dropoffMs = candidate.stops[dropoff]?.plannedArrivalTimeMs ?? 0;
  return {
    waitMinutes: wholeMinutes(pickupMs - request.requestTimeMs),
    detourMinutes: wholeMinutes(dropoffMs - pickupMs - request.directTravelTimeMs),
    othersDelayed: delayedPassengers(vehicle, candidate),
  };
};

const plural = (count: number, noun: string): string => `${count} ${noun}${count === 1 ? "" : "s"}`;

const delayInWords = (item: DelayedPassenger): string =>
  `${item.requestId} by ${plural(item.extraMinutes, "minute")}`;

const delaysInWords = (delayed: readonly DelayedPassenger[]): string =>
  delayed.length === 0 ? "delays nobody else" : `delays ${delayed.map(delayInWords).join(" and ")}`;

const rideInWords = (consequences: Consequences): string => {
  const wait =
    consequences.waitMinutes === 0
      ? "picked up immediately"
      : `picked up in ${plural(consequences.waitMinutes, "minute")}`;
  const ride =
    consequences.detourMinutes === 0
      ? "direct ride"
      : `${plural(consequences.detourMinutes, "minute")} of detour`;
  return `${wait}, ${ride}`;
};

/** One option with the same named fields as every other option, plus a sentence. */
export const jevCandidateOption = (
  observation: Observation,
  candidate: Candidate,
): ChoiceOption => {
  const consequences = consequencesOf(observation, candidate);
  const largest = Math.max(0, ...consequences.othersDelayed.map((item) => item.extraMinutes));
  return {
    id: candidate.id,
    description: {
      what: `Vehicle ${candidate.vehicleId}: ${rideInWords(consequences)}, ${delaysInWords(consequences.othersDelayed)}.`,
      vehicle: candidate.vehicleId,
      new_passenger_wait_minutes: consequences.waitMinutes,
      new_passenger_detour_minutes: consequences.detourMinutes,
      passengers_delayed: consequences.othersDelayed.length,
      largest_delay_to_others_minutes: largest,
    },
  };
};

const fleetSummary = (observation: Observation): JsonValue[] =>
  observation.vehicles.map((vehicle) => ({
    vehicle: vehicle.id,
    riders_on_board: vehicle.onboardRequestIds.length,
    planned_stops: vehicle.stops.length,
    status: vehicle.stops.length === 0 ? "idle" : "busy",
  }));

/** Filtered state: the new passenger and a one-line fleet summary; nothing else. */
export const jevDecisionState = (observation: Observation): Record<string, JsonValue> => {
  const request = requestOf(observation, observation.decisionRequestId);
  return {
    promptVersion: JEV_PROMPT_VERSION,
    new_passenger: {
      id: request.id,
      waiting_minutes_so_far: wholeMinutes(observation.nowMs - request.requestTimeMs),
      direct_ride_minutes: wholeMinutes(request.directTravelTimeMs),
    },
    fleet: fleetSummary(observation),
  };
};

const soonestWaitMinutes = (observation: Observation, candidates: readonly Candidate[]): number =>
  candidates.reduce(
    (soonest, candidate) => Math.min(soonest, consequencesOf(observation, candidate).waitMinutes),
    Number.POSITIVE_INFINITY,
  );

const vehicleInWords = (vehicle: ObservedVehicle, soonest: number): string => {
  const busy =
    vehicle.stops.length === 0
      ? "idle"
      : `busy with ${plural(vehicle.stops.length, "planned stop")}`;
  const riders = plural(vehicle.onboardRequestIds.length, "rider");
  return `Vehicle ${vehicle.id}: ${busy}, ${riders} on board, soonest pickup in ${plural(soonest, "minute")}.`;
};

/** Stage-one option for the hierarchical procedure: one vehicle in words. */
export const jevVehicleOption = (
  observation: Observation,
  vehicle: ObservedVehicle,
  candidates: readonly Candidate[],
): ChoiceOption => {
  const soonest = candidates.length === 0 ? 0 : soonestWaitMinutes(observation, candidates);
  return {
    id: vehicle.id,
    description: {
      what: vehicleInWords(vehicle, soonest),
      riders_on_board: vehicle.onboardRequestIds.length,
      planned_stops: vehicle.stops.length,
      soonest_pickup_minutes: soonest,
      legal_insertions: candidates.length,
    },
  };
};
