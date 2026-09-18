import { type Candidate, type CandidateStop, type Observation } from "@bus20/contracts/observation";

export const MINUTE = 60_000;

export const stop = (requestId: string, kind: "pickup" | "dropoff", at: number): CandidateStop => ({
  requestId,
  kind,
  nodeId: "n",
  plannedArrivalTimeMs: at,
});

const vehicle = (id: string, capacity: number, onboard: string[], stops: CandidateStop[]) => ({
  id,
  capacity,
  position: { kind: "atNode" as const, nodeId: "a" },
  onboardRequestIds: onboard,
  stops,
});

const request = (
  id: string,
  at: number,
  phase: "assigned" | "onboard" | "waiting",
  direct: number,
) => ({
  id,
  requestTimeMs: at,
  originNodeId: "d",
  destinationNodeId: "e",
  phase,
  directTravelTimeMs: direct,
});

/** r3 inserted after r1's pickup and after r1's drop-off: r1 shifts 1 min, r2 shifts 3 min. */
export const INSERT: Candidate = {
  id: "v1:1:3",
  vehicleId: "v1",
  stops: [
    stop("r1", "pickup", 2 * MINUTE),
    stop("r3", "pickup", 4 * MINUTE),
    stop("r1", "dropoff", 6 * MINUTE),
    stop("r3", "dropoff", 9 * MINUTE),
    stop("r2", "dropoff", 11 * MINUTE),
  ],
};

/** r3 appended to v1: nothing shifts. */
export const APPEND: Candidate = {
  id: "v1:3:4",
  vehicleId: "v1",
  stops: [
    stop("r1", "pickup", 2 * MINUTE),
    stop("r1", "dropoff", 5 * MINUTE),
    stop("r2", "dropoff", 8 * MINUTE),
    stop("r3", "pickup", 10 * MINUTE),
    stop("r3", "dropoff", 12 * MINUTE),
  ],
};

export const IDLE: Candidate = {
  id: "v2:0:1",
  vehicleId: "v2",
  stops: [stop("r3", "pickup", 3 * MINUTE), stop("r3", "dropoff", 5 * MINUTE)],
};

/** v1 carries r1 (pickup at 2, drop at 5) and r2 (drop at 8); v2 is idle; v3 is full. */
export const observation = (): Observation => ({
  schemaVersion: "bus20-observation/1",
  scenarioId: "s",
  stateVersion: 4,
  nowMs: MINUTE,
  decisionRequestId: "r3",
  vehicles: [
    vehicle(
      "v1",
      4,
      ["r2"],
      [
        stop("r1", "pickup", 2 * MINUTE),
        stop("r1", "dropoff", 5 * MINUTE),
        stop("r2", "dropoff", 8 * MINUTE),
      ],
    ),
    vehicle("v2", 4, [], []),
    vehicle("v3", 1, ["r9"], [stop("r9", "dropoff", 30 * MINUTE)]),
  ],
  requests: [
    request("r1", 0, "assigned", 3 * MINUTE),
    request("r2", 0, "onboard", 6 * MINUTE),
    request("r3", MINUTE, "waiting", 2 * MINUTE),
  ],
  candidates: [INSERT, APPEND, IDLE],
});
