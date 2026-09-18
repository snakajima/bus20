/**
 * Hand-written programs used by the offline sample generator. They exist so
 * the whole campaign and experiment pipeline can run without a model; they
 * are labelled `provider: "sample"` and must never be reported as generated
 * by a model.
 */
export const FIRST_CANDIDATE_PROGRAM = `// sample: always the first offered candidate
function decide(o: any) {
  return { kind: "chooseCandidate", schemaVersion: "bus20-action/1", stateVersion: o.stateVersion, candidateId: o.candidates[0].id };
}
`;

export const APPEND_EARLIEST_PROGRAM = `// sample: append to the vehicle that picks the passenger up soonest
function pickupTime(candidate: any, requestId: string): number {
  const stop = candidate.stops.find((s: any) => s.requestId === requestId && s.kind === "pickup");
  return stop ? stop.plannedArrivalTimeMs : Number.POSITIVE_INFINITY;
}
function isAppend(candidate: any): boolean {
  const n = candidate.stops.length;
  return candidate.id === candidate.vehicleId + ":" + (n - 2) + ":" + (n - 1);
}
function decide(o: any) {
  const appends = o.candidates.filter(isAppend);
  const pool = appends.length > 0 ? appends : o.candidates;
  let best: any = undefined;
  for (const c of pool) {
    if (!best || pickupTime(c, o.decisionRequestId) < pickupTime(best, o.decisionRequestId)) {
      best = c;
    }
  }
  return { kind: "chooseCandidate", schemaVersion: "bus20-action/1", stateVersion: o.stateVersion, candidateId: best.id };
}
`;

export const MIN_INCREMENTAL_PAIN_PROGRAM = `// sample: choose the candidate with the smallest increase in total squared delay
function planCost(stops: any[], requests: Map<string, any>): number {
  let total = 0;
  for (const stop of stops) {
    if (stop.kind !== "dropoff") continue;
    const request = requests.get(stop.requestId);
    if (!request) continue;
    const delay = stop.plannedArrivalTimeMs - request.requestTimeMs - request.directTravelTimeMs;
    total += delay * delay;
  }
  return total;
}
function decide(o: any) {
  const requests = new Map<string, any>();
  for (const r of o.requests) requests.set(r.id, r);
  const basis = new Map<string, number>();
  for (const v of o.vehicles) basis.set(v.id, planCost(v.stops, requests));
  let best: any = undefined;
  let bestCost = Number.POSITIVE_INFINITY;
  for (const c of o.candidates) {
    const cost = planCost(c.stops, requests) - (basis.get(c.vehicleId) ?? 0);
    if (cost < bestCost) {
      bestCost = cost;
      best = c;
    }
  }
  return { kind: "chooseCandidate", schemaVersion: "bus20-action/1", stateVersion: o.stateVersion, candidateId: best.id };
}
`;

/** Ordered from weakest to strongest, which is what the sample generator "improves" along. */
export const SAMPLE_LADDER = [
  FIRST_CANDIDATE_PROGRAM,
  APPEND_EARLIEST_PROGRAM,
  MIN_INCREMENTAL_PAIN_PROGRAM,
] as const;
