import { OBJECTIVE_TEXT } from "@bus20/models/decision-brief";

/** Version of the program specification given to generators. */
export const PROGRAM_PROMPT_VERSION = "bus20-program-prompt/1" as const;

/**
 * The contract a generated program must satisfy. This is the only
 * description of the task the generator receives in the main condition: no
 * Swift source, no reference decisions, no test data.
 */
export const PROGRAM_SPEC = `${OBJECTIVE_TEXT}

You are writing a dispatch PROGRAM, not answering one decision. Write a single
self-contained TypeScript script (no imports, no exports, no require, no
process, no fetch, no timers, no console) that declares a top-level function:

  function decide(observation: Observation): Action

It is called once per new passenger with the current observation and must
return exactly one action. The host validates every action; an invalid action
fails the whole run. Math.random is seeded by the host and Date.now is
constant, so the program must be deterministic. Each call has a CPU time
limit of a few hundred milliseconds and a memory cap; keep it efficient.
You may keep state in top-level variables between calls within one run.

Observation (JSON, all times are integer milliseconds of virtual time):
  {
    stateVersion: number;              // echo this in the action
    nowMs: number;
    decisionRequestId: string;         // the passenger to place now
    vehicles: {
      id: string; capacity: number;
      position: { kind: "atNode"; nodeId: string }
              | { kind: "onEdge"; edgeId: string; fromNodeId: string; toNodeId: string; arrivalTimeMs: number };
      onboardRequestIds: string[];
      stops: { requestId: string; kind: "pickup" | "dropoff"; nodeId: string; plannedArrivalTimeMs: number }[];
    }[];
    requests: {                        // released, unfinished passengers only
      id: string; requestTimeMs: number; originNodeId: string; destinationNodeId: string;
      phase: "waiting" | "assigned" | "onboard"; directTravelTimeMs: number;
    }[];
    candidates: {                      // every legal insertion; order carries no meaning
      id: string; vehicleId: string;
      stops: { requestId: string; kind: "pickup" | "dropoff"; nodeId: string; plannedArrivalTimeMs: number }[];
    }[];
  }

Action (return this object):
  { kind: "chooseCandidate"; schemaVersion: "bus20-action/1"; stateVersion: number; candidateId: string }

A passenger's pain is ((dropoffMs - requestTimeMs - directTravelTimeMs) / 60000) squared.
A candidate's stops include planned arrival times for every stop of that
vehicle, so the effect of a choice on every affected passenger can be
computed from the observation alone. Reply with the complete program in one
fenced code block marked typescript and nothing else.`;
