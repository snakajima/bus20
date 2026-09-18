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
  CANDIDATE_ENCODING_TEXT,
  describeCandidate,
  PROMPT_VERSION,
} from "./decision-brief.js";
import {
  CONSEQUENCES_PROMPT_VERSION,
  JEV_CANDIDATE_INSTRUCTIONS,
  JEV_VEHICLE_INSTRUCTIONS,
  jevCandidateOption,
  jevDecisionState,
  jevVehicleOption,
} from "./jev-native.js";

/**
 * How observations become choice requests. `consequences` (prompt version 3)
 * is the common brief every model receives; `numeric` (version 2) is the
 * earlier form with planned times and shift constants, kept for comparison.
 */
export interface Presentation {
  readonly id: "consequences" | "numeric";
  readonly promptVersion: string;
  /** How options are encoded, in prose, for models that take a system prompt. */
  readonly encodingText: string;
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

export const NUMERIC_PRESENTATION: Presentation = {
  id: "numeric",
  promptVersion: PROMPT_VERSION,
  encodingText: CANDIDATE_ENCODING_TEXT,
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

export const CONSEQUENCES_PRESENTATION: Presentation = {
  id: "consequences",
  promptVersion: CONSEQUENCES_PROMPT_VERSION,
  encodingText: `${JEV_CANDIDATE_INSTRUCTIONS.how_to_read_options} ${JEV_CANDIDATE_INSTRUCTIONS.task}`,
  state: jevDecisionState,
  candidateQuestion: { ...JEV_CANDIDATE_INSTRUCTIONS },
  vehicleQuestion: { ...JEV_VEHICLE_INSTRUCTIONS },
  candidateOption: jevCandidateOption,
  vehicleOption: jevVehicleOption,
};

export const PRESENTATIONS = ["consequences", "numeric"] as const;
export type PresentationId = (typeof PRESENTATIONS)[number];

/** The common condition every model receives unless a run overrides it. */
export const DEFAULT_PRESENTATION_ID: PresentationId = "consequences";

export const presentationById = (id: PresentationId): Presentation =>
  id === "numeric" ? NUMERIC_PRESENTATION : CONSEQUENCES_PRESENTATION;
