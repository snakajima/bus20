import { type JsonValue } from "@bus20/contracts/json-value";
import {
  type Candidate,
  type Observation,
  type ObservedVehicle,
} from "@bus20/contracts/observation";
import { msToMinutes } from "@bus20/contracts/time";
import { type ChoiceOption, type ChoiceRequest } from "./choice-client.js";
import {
  briefVehicle,
  buildDecisionState,
  describeCandidate,
  PROMPT_VERSION,
} from "./decision-brief.js";
import {
  JEV_CANDIDATE_INSTRUCTIONS,
  JEV_PROMPT_VERSION,
  JEV_VEHICLE_INSTRUCTIONS,
  jevCandidateOption,
  jevDecisionState,
  jevVehicleOption,
} from "./jev-native.js";

/**
 * How observations become choice requests. `shared` is the common brief every
 * model receives; `jev-native` carries the same information in the form the
 * TypeSafe documentation recommends for System One models.
 */
export interface Presentation {
  readonly id: "shared" | "jev-native";
  readonly promptVersion: string;
  readonly state: (observation: Observation) => Record<string, JsonValue>;
  readonly candidateQuestion: ChoiceRequest["question"];
  readonly vehicleQuestion: ChoiceRequest["question"];
  readonly candidateOption: (observation: Observation, candidate: Candidate) => ChoiceOption;
  readonly vehicleOption: (
    observation: Observation,
    vehicle: ObservedVehicle,
    candidates: readonly Candidate[],
  ) => ChoiceOption;
}

const earliestPickupMinutes = (
  candidates: readonly Candidate[],
  requestId: string,
): number | null => {
  const times = candidates.flatMap((candidate) =>
    candidate.stops.flatMap((stop) =>
      stop.requestId === requestId && stop.kind === "pickup" ? [stop.plannedArrivalTimeMs] : [],
    ),
  );
  return times.length === 0 ? null : Number(msToMinutes(Math.min(...times)).toFixed(3));
};

export const SHARED_PRESENTATION: Presentation = {
  id: "shared",
  promptVersion: PROMPT_VERSION,
  state: buildDecisionState,
  candidateQuestion: "Which candidate should the new passenger be assigned to?",
  vehicleQuestion:
    "Which vehicle should serve the new passenger? The next question offers that vehicle's insertions.",
  candidateOption: (observation, candidate) => ({
    id: candidate.id,
    description: describeCandidate(observation, candidate),
  }),
  vehicleOption: (observation, vehicle, candidates) => ({
    id: vehicle.id,
    description: {
      ...briefVehicle(vehicle),
      legalInsertions: candidates.length,
      earliestPickupMinutes: earliestPickupMinutes(candidates, observation.decisionRequestId),
    },
  }),
};

export const JEV_NATIVE_PRESENTATION: Presentation = {
  id: "jev-native",
  promptVersion: JEV_PROMPT_VERSION,
  state: jevDecisionState,
  candidateQuestion: { ...JEV_CANDIDATE_INSTRUCTIONS },
  vehicleQuestion: { ...JEV_VEHICLE_INSTRUCTIONS },
  candidateOption: jevCandidateOption,
  vehicleOption: jevVehicleOption,
};

export const PRESENTATIONS = ["shared", "jev-native"] as const;
export type PresentationId = (typeof PRESENTATIONS)[number];

export const presentationById = (id: PresentationId): Presentation =>
  id === "jev-native" ? JEV_NATIVE_PRESENTATION : SHARED_PRESENTATION;
