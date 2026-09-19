import { type Candidate, type CandidateStop, type Observation } from "@bus20/contracts/observation";

/**
 * The corrected Swift insertion rule stated in TypeScript: a passenger's pain
 * is the squared delay against a direct trip, `(dropoff - release - direct)²`,
 * and a candidate's cost is how much it adds to its vehicle's plan. Exact
 * integer ms² so ties are exact and match the Swift CLI decision by decision.
 */
export interface RequestTiming {
  readonly requestTimeMs: number;
  readonly directTravelTimeMs: number;
}

export type TimingLookup = (requestId: string) => RequestTiming;

export const squaredDelayMs2 = (dropoffTimeMs: number, timing: RequestTiming): number => {
  const delay = dropoffTimeMs - timing.requestTimeMs - timing.directTravelTimeMs;
  return Math.max(0, delay) ** 2;
};

/** Total squared delay of every passenger dropped off along a timed stop list. */
export const planCostMs2 = (stops: readonly CandidateStop[], timing: TimingLookup): number =>
  stops.reduce(
    (total, stop) =>
      stop.kind === "dropoff"
        ? total + squaredDelayMs2(stop.plannedArrivalTimeMs, timing(stop.requestId))
        : total,
    0,
  );

export const timingFromObservation = (observation: Observation): TimingLookup => {
  const index = new Map(observation.requests.map((request) => [request.id, request]));
  return (requestId) => {
    const request = index.get(requestId);
    if (request === undefined) {
      throw new Error(`observation has no request "${requestId}"`);
    }
    return request;
  };
};

export interface RankedCandidate {
  readonly candidate: Candidate;
  readonly incrementalCostMs2: number;
}

/** Every candidate's incremental cost over its vehicle's current plan, in host order. */
export const incrementalCosts = (observation: Observation): RankedCandidate[] => {
  const timing = timingFromObservation(observation);
  const basis = new Map(
    observation.vehicles.map((vehicle) => [vehicle.id, planCostMs2(vehicle.stops, timing)]),
  );
  return observation.candidates.map((candidate) => ({
    candidate,
    incrementalCostMs2:
      planCostMs2(candidate.stops, timing) - (basis.get(candidate.vehicleId) ?? 0),
  }));
};

/** The `count` cheapest candidates by incremental cost; ties keep host order. */
export const shortlistByCost = (observation: Observation, count: number): RankedCandidate[] =>
  incrementalCosts(observation)
    .map((item, index) => ({ item, index }))
    .sort(
      (left, right) =>
        left.item.incrementalCostMs2 - right.item.incrementalCostMs2 || left.index - right.index,
    )
    .slice(0, count)
    .map(({ item }) => item);
