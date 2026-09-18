import { type Action } from "@bus20/contracts/action";
import { type Candidate, type CandidateStop, type Observation } from "@bus20/contracts/observation";
import { ACTION_SCHEMA_VERSION } from "@bus20/contracts/versions";
import { type Policy } from "@bus20/simulator/policy";

/**
 * Independent TypeScript statement of the corrected Swift insertion rule,
 * written from the protocol rather than from the Swift code, so the two can
 * be compared decision by decision.
 */
export interface Verdict {
  readonly candidateId: string;
  readonly incrementalCostMs2: number;
}

const releaseAndDirect = (observation: Observation, requestId: string): [number, number] => {
  const request = observation.requests.find((item) => item.id === requestId);
  if (request === undefined) {
    throw new Error(`unknown request ${requestId}`);
  }
  return [request.requestTimeMs, request.directTravelTimeMs];
};

const planCost = (observation: Observation, stops: readonly CandidateStop[]): number =>
  stops
    .filter((stop) => stop.kind === "dropoff")
    .reduce((total, stop) => {
      const [release, direct] = releaseAndDirect(observation, stop.requestId);
      const delay = stop.plannedArrivalTimeMs - release - direct;
      if (delay < 0) {
        throw new Error(`negative delay for ${stop.requestId}`);
      }
      return total + delay * delay;
    }, 0);

const incrementalCost = (observation: Observation, candidate: Candidate): number => {
  const vehicle = observation.vehicles.find((item) => item.id === candidate.vehicleId);
  if (vehicle === undefined) {
    throw new Error(`unknown vehicle ${candidate.vehicleId}`);
  }
  return planCost(observation, candidate.stops) - planCost(observation, vehicle.stops);
};

/** Every candidate's incremental cost, in host order. */
export const allCosts = (observation: Observation): readonly Verdict[] =>
  observation.candidates.map((candidate) => ({
    candidateId: candidate.id,
    incrementalCostMs2: incrementalCost(observation, candidate),
  }));

export const independentChoice = (observation: Observation): Verdict => {
  const verdict = allCosts(observation).reduce<Verdict | undefined>(
    (best, item) =>
      best === undefined || item.incrementalCostMs2 < best.incrementalCostMs2 ? item : best,
    undefined,
  );
  if (verdict === undefined) {
    throw new Error("no candidates");
  }
  return verdict;
};

export const createIndependentPolicy = (): Policy & { readonly verdicts: Verdict[] } => {
  const verdicts: Verdict[] = [];
  return {
    verdicts,
    descriptor: { id: "independent-insertion-rule", kind: "fixture" },
    decide: (observation) => {
      const verdict = independentChoice(observation);
      verdicts.push(verdict);
      const action: Action = {
        kind: "chooseCandidate",
        schemaVersion: ACTION_SCHEMA_VERSION,
        stateVersion: observation.stateVersion,
        candidateId: verdict.candidateId,
      };
      return Promise.resolve({ action });
    },
  };
};
