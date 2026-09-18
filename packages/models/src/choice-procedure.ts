import { type JsonValue } from "@bus20/contracts/json-value";
import {
  type Candidate,
  type Observation,
  type ObservedVehicle,
} from "@bus20/contracts/observation";
import { msToMinutes } from "@bus20/contracts/time";
import { type Decision } from "@bus20/simulator/policy";
import { chooseCandidateAction } from "./choose-action.js";
import { type ChoiceClient, type ChoiceOption, type ChoiceReply } from "./choice-client.js";
import {
  assertChoiceFits,
  briefVehicle,
  buildDecisionState,
  describeCandidate,
} from "./decision-brief.js";

export const CHOICE_MODES = ["flat", "hierarchical", "auto"] as const;
export type ChoiceMode = (typeof CHOICE_MODES)[number];

export interface ChoiceSettings {
  readonly mode: ChoiceMode;
  /** In `auto` mode, flat when at most this many candidates are offered. */
  readonly flatLimit: number;
}

export const DEFAULT_CHOICE_SETTINGS: ChoiceSettings = { mode: "auto", flatLimit: 40 };

const CANDIDATE_QUESTION = "Which candidate should the new passenger be assigned to?";
const VEHICLE_QUESTION =
  "Which vehicle should serve the new passenger? The next question offers that vehicle's insertions.";

const candidateOptions = (
  observation: Observation,
  candidates: readonly Candidate[],
): ChoiceOption[] =>
  candidates.map((candidate) => ({
    id: candidate.id,
    description: describeCandidate(observation, candidate),
  }));

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

/** Stage-one option: the vehicle itself plus how many insertions it offers and its earliest pickup. */
const vehicleOptions = (observation: Observation): ChoiceOption[] =>
  observation.vehicles.flatMap((vehicle: ObservedVehicle) => {
    const candidates = observation.candidates.filter(
      (candidate) => candidate.vehicleId === vehicle.id,
    );
    if (candidates.length === 0) {
      return [];
    }
    return [
      {
        id: vehicle.id,
        description: {
          ...briefVehicle(vehicle),
          legalInsertions: candidates.length,
          earliestPickupMinutes: earliestPickupMinutes(candidates, observation.decisionRequestId),
        },
      },
    ];
  });

const sumUsage = (replies: readonly ChoiceReply[]): Record<string, number> => {
  const total: Record<string, number> = { stages: replies.length };
  for (const reply of replies) {
    for (const [key, value] of Object.entries(reply.usage)) {
      total[key] = (total[key] ?? 0) + value;
    }
  }
  return total;
};

const toDecision = (
  observation: Observation,
  replies: readonly ChoiceReply[],
  choice: string,
): Decision => ({
  action: chooseCandidateAction(observation, choice),
  usage: { ...sumUsage(replies), candidatesOffered: observation.candidates.length },
  trace: { stages: replies.map((reply): JsonValue => ({ ...reply.trace })) },
});

const decideFlat = async (client: ChoiceClient, observation: Observation): Promise<Decision> => {
  assertChoiceFits(observation.candidates.length, "candidates");
  const reply = await client.ask({
    state: buildDecisionState(observation),
    question: CANDIDATE_QUESTION,
    options: candidateOptions(observation, observation.candidates),
  });
  return toDecision(observation, [reply], reply.choice);
};

const chooseVehicle = async (
  client: ChoiceClient,
  observation: Observation,
): Promise<ChoiceReply | undefined> => {
  const options = vehicleOptions(observation);
  assertChoiceFits(options.length, "vehicles");
  if (options.length === 1) {
    return undefined;
  }
  return client.ask({
    state: buildDecisionState(observation),
    question: VEHICLE_QUESTION,
    options,
  });
};

/**
 * Two stages: pick a vehicle among those with at least one legal insertion,
 * then pick an insertion within it. A single eligible vehicle skips stage one.
 */
const decideHierarchical = async (
  client: ChoiceClient,
  observation: Observation,
): Promise<Decision> => {
  const first = await chooseVehicle(client, observation);
  const vehicleId = first?.choice ?? vehicleOptions(observation)[0]?.id ?? "";
  const candidates = observation.candidates.filter(
    (candidate) => candidate.vehicleId === vehicleId,
  );
  assertChoiceFits(candidates.length, `insertions for vehicle "${vehicleId}"`);
  const second = await client.ask({
    state: { ...buildDecisionState(observation), chosenVehicleId: vehicleId },
    question: CANDIDATE_QUESTION,
    options: candidateOptions(observation, candidates),
  });
  return toDecision(observation, first === undefined ? [second] : [first, second], second.choice);
};

const isFlat = (settings: ChoiceSettings, observation: Observation): boolean =>
  settings.mode === "flat" ||
  (settings.mode === "auto" && observation.candidates.length <= settings.flatLimit);

/** Runs the configured procedure; every stage's usage and trace is kept. */
export const decideByChoice = (
  client: ChoiceClient,
  observation: Observation,
  settings: ChoiceSettings,
): Promise<Decision> =>
  isFlat(settings, observation)
    ? decideFlat(client, observation)
    : decideHierarchical(client, observation);
