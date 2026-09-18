import { type Action } from "@bus20/contracts/action";
import { type Candidate, type Observation } from "@bus20/contracts/observation";
import { ACTION_SCHEMA_VERSION } from "@bus20/contracts/versions";
import { candidateId } from "./candidates.js";
import { type Policy } from "./policy.js";

export const FIXTURE_POLICY_ID = "fixture-append-earliest-pickup" as const;

const isAppendCandidate = (candidate: Candidate): boolean => {
  const count = candidate.stops.length;
  return candidate.id === candidateId(candidate.vehicleId, count - 2, count - 1);
};

const pickupTimeMs = (candidate: Candidate, requestId: string): number =>
  candidate.stops.find((stop) => stop.requestId === requestId && stop.kind === "pickup")
    ?.plannedArrivalTimeMs ?? Number.POSITIVE_INFINITY;

const earliestPickup = (
  candidates: readonly Candidate[],
  requestId: string,
): Candidate | undefined =>
  candidates.reduce<Candidate | undefined>((chosen, candidate) => {
    const better =
      chosen === undefined || pickupTimeMs(candidate, requestId) < pickupTimeMs(chosen, requestId);
    return better ? candidate : chosen;
  }, undefined);

const chooseAppend = (observation: Observation): Action | undefined => {
  const appends = observation.candidates.filter(isAppendCandidate);
  const pool = appends.length > 0 ? appends : observation.candidates;
  const best = earliestPickup(pool, observation.decisionRequestId);
  if (best === undefined) {
    return undefined;
  }
  return {
    kind: "chooseCandidate",
    schemaVersion: ACTION_SCHEMA_VERSION,
    stateVersion: observation.stateVersion,
    candidateId: best.id,
  };
};

/**
 * Smoke-test baseline only: append the new passenger to the end of the
 * vehicle that would pick them up soonest, ties by candidate order. This is
 * neither the Swift reference nor an AI policy and must never be reported as one.
 */
export const createFixturePolicy = (): Policy => ({
  descriptor: { id: FIXTURE_POLICY_ID, kind: "fixture" },
  decide: (observation) => {
    const action = chooseAppend(observation);
    return action === undefined
      ? Promise.reject(new Error("no legal candidate"))
      : Promise.resolve({ action });
  },
});
