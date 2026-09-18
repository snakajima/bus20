import { type JsonValue } from "@bus20/contracts/json-value";
import {
  type Candidate,
  type Observation,
  type ObservedVehicle,
} from "@bus20/contracts/observation";
import { type Decision } from "@bus20/simulator/policy";
import { chooseCandidateAction } from "./choose-action.js";
import {
  askAll,
  type ChoiceClient,
  type ChoiceOption,
  type ChoiceReply,
  type ChoiceRequest,
} from "./choice-client.js";
import { assertChoiceFits } from "./decision-brief.js";
import { type Presentation, SHARED_PRESENTATION } from "./presentation.js";

export const CHOICE_MODES = ["flat", "hierarchical", "auto", "tournament"] as const;
export type ChoiceMode = (typeof CHOICE_MODES)[number];

export interface ChoiceSettings {
  readonly mode: ChoiceMode;
  /** In `auto` and `tournament` modes, flat when at most this many candidates are offered. */
  readonly flatLimit: number;
  /** In `tournament` mode, candidates per chunk in the first round. */
  readonly chunkSize?: number;
}

export const DEFAULT_CHOICE_SETTINGS: ChoiceSettings = { mode: "auto", flatLimit: 40 };
export const DEFAULT_CHUNK_SIZE = 120;

const candidateOptions = (
  presentation: Presentation,
  observation: Observation,
  candidates: readonly Candidate[],
): ChoiceOption[] =>
  candidates.map((candidate) => presentation.candidateOption(observation, candidate));

/** Stage-one options: vehicles with at least one legal insertion, in host order. */
const vehicleOptions = (presentation: Presentation, observation: Observation): ChoiceOption[] =>
  observation.vehicles.flatMap((vehicle: ObservedVehicle) => {
    const candidates = observation.candidates.filter(
      (candidate) => candidate.vehicleId === vehicle.id,
    );
    return candidates.length === 0
      ? []
      : [presentation.vehicleOption(observation, vehicle, candidates)];
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

const decideFlat = async (
  client: ChoiceClient,
  presentation: Presentation,
  observation: Observation,
): Promise<Decision> => {
  assertChoiceFits(observation.candidates.length, "candidates");
  const reply = await client.ask({
    state: presentation.state(observation),
    question: presentation.candidateQuestion,
    options: candidateOptions(presentation, observation, observation.candidates),
  });
  return toDecision(observation, [reply], reply.choice);
};

const chooseVehicle = async (
  client: ChoiceClient,
  presentation: Presentation,
  observation: Observation,
): Promise<ChoiceReply | undefined> => {
  const options = vehicleOptions(presentation, observation);
  assertChoiceFits(options.length, "vehicles");
  if (options.length === 1) {
    return undefined;
  }
  return client.ask({
    state: presentation.state(observation),
    question: presentation.vehicleQuestion,
    options,
  });
};

/**
 * Two stages: pick a vehicle among those with at least one legal insertion,
 * then pick an insertion within it. A single eligible vehicle skips stage one.
 */
const decideHierarchical = async (
  client: ChoiceClient,
  presentation: Presentation,
  observation: Observation,
): Promise<Decision> => {
  const first = await chooseVehicle(client, presentation, observation);
  const vehicleId = first?.choice ?? vehicleOptions(presentation, observation)[0]?.id ?? "";
  const candidates = observation.candidates.filter(
    (candidate) => candidate.vehicleId === vehicleId,
  );
  assertChoiceFits(candidates.length, `insertions for vehicle "${vehicleId}"`);
  const second = await client.ask({
    state: { ...presentation.state(observation), chosenVehicleId: vehicleId },
    question: presentation.candidateQuestion,
    options: candidateOptions(presentation, observation, candidates),
  });
  return toDecision(observation, first === undefined ? [second] : [first, second], second.choice);
};

/** Round one: one choice per chunk of candidates, all in one round trip; round two: the chunk winners. */
const decideTournament = async (
  client: ChoiceClient,
  presentation: Presentation,
  observation: Observation,
  chunkSize: number,
): Promise<Decision> => {
  const state = presentation.state(observation);
  const requests = chunkRequests(presentation, observation, state, chunkSize);
  const firstRound = await askAll(client, requests);
  const winners = winnersOf(observation, firstRound);
  const final = await client.ask({
    state: { ...state, round: "final" },
    question: presentation.candidateQuestion,
    options: candidateOptions(presentation, observation, winners),
  });
  return toDecision(observation, [...firstRound, final], final.choice);
};

const winnersOf = (observation: Observation, replies: readonly ChoiceReply[]): Candidate[] => {
  const winners = replies.flatMap((reply) =>
    observation.candidates.filter((candidate) => candidate.id === reply.choice),
  );
  assertChoiceFits(winners.length, "chunk winners");
  return winners;
};

const chunkRequests = (
  presentation: Presentation,
  observation: Observation,
  state: Record<string, JsonValue>,
  chunkSize: number,
): ChoiceRequest[] =>
  chunk(observation.candidates, chunkSize).map((group) => ({
    state,
    question: presentation.candidateQuestion,
    options: candidateOptions(presentation, observation, group),
  }));

const chunk = <T>(items: readonly T[], size: number): T[][] => {
  const groups: T[][] = [];
  for (let start = 0; start < items.length; start += size) {
    groups.push(items.slice(start, start + size));
  }
  return groups;
};

const isFlat = (settings: ChoiceSettings, observation: Observation): boolean =>
  settings.mode === "flat" ||
  ((settings.mode === "auto" || settings.mode === "tournament") &&
    observation.candidates.length <= settings.flatLimit);

/** Runs the configured procedure; every stage's usage and trace is kept. */
export const decideByChoice = (
  client: ChoiceClient,
  observation: Observation,
  settings: ChoiceSettings,
  presentation: Presentation = SHARED_PRESENTATION,
): Promise<Decision> => {
  if (isFlat(settings, observation)) {
    return decideFlat(client, presentation, observation);
  }
  if (settings.mode === "tournament") {
    const size = settings.chunkSize ?? DEFAULT_CHUNK_SIZE;
    return decideTournament(client, presentation, observation, size);
  }
  return decideHierarchical(client, presentation, observation);
};
