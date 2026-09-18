import { digestDocument } from "@bus20/contracts/digest";
import { findDuplicateIds } from "@bus20/contracts/ids";
import { type MapDocument } from "@bus20/contracts/map";
import { type Journey, type RunFailureReason, type RunLog } from "@bus20/contracts/run-log";
import {
  type PassengerScore,
  type RunResult,
  type ScoreSummary,
} from "@bus20/contracts/run-result";
import { type RideRequest, type ScenarioDocument } from "@bus20/contracts/scenario";
import { msToMinutes } from "@bus20/contracts/time";
import { PROTOCOL_VERSION, RUN_RESULT_SCHEMA_VERSION } from "@bus20/contracts/versions";
import { directTravelTimes } from "./direct-travel.js";
import { checkJourneyTimes, type JourneyTimes, painBreakdown, painMinutesSquared } from "./pain.js";
import { maximum, mean, percentileNearestRank } from "./statistics.js";

const P95 = 0.95;
const P99 = 0.99;

interface Failure {
  readonly reason: RunFailureReason;
  readonly detail: string;
}

type ResultBase = Pick<
  RunResult,
  "schemaVersion" | "protocolVersion" | "scenarioId" | "policy" | "requestCount" | "completedCount"
>;

type Scored<T> = T | Failure;

interface Graded {
  readonly passengers: PassengerScore[];
}

const isFailure = <T extends object>(value: Scored<T>): value is Failure => "reason" in value;

const failure = (reason: RunFailureReason, detail: string): Failure => ({ reason, detail });

const provenanceMismatches = (
  scenario: ScenarioDocument,
  map: MapDocument,
  log: RunLog,
): string[] => {
  const mapDigest = digestDocument(map);
  const checks: readonly (readonly [boolean, string])[] = [
    [log.scenarioId !== scenario.id, `scenarioId "${log.scenarioId}" is not "${scenario.id}"`],
    [log.scenarioDigest !== digestDocument(scenario), "scenarioDigest does not match the scenario"],
    [
      log.mapDigest !== mapDigest || scenario.map.digest !== mapDigest,
      "mapDigest does not match the map",
    ],
  ];
  return checks.filter(([mismatch]) => mismatch).map(([, message]) => message);
};

const checkProvenance = (
  scenario: ScenarioDocument,
  map: MapDocument,
  log: RunLog,
): Failure | undefined => {
  const mismatches = provenanceMismatches(scenario, map, log);
  return mismatches.length === 0 ? undefined : failure("inconsistentLog", mismatches.join("; "));
};

const indexJourneys = (
  scenario: ScenarioDocument,
  log: RunLog,
): Scored<ReadonlyMap<string, Journey>> => {
  const duplicates = findDuplicateIds(log.journeys.map((journey) => journey.requestId));
  if (duplicates.length > 0) {
    return failure("inconsistentLog", `served twice: ${duplicates.join(", ")}`);
  }
  const known = new Set(scenario.requests.map((request) => request.id));
  const unknown = log.journeys.filter((journey) => !known.has(journey.requestId));
  if (unknown.length > 0) {
    const ids = unknown.map((journey) => journey.requestId).join(", ");
    return failure("inconsistentLog", `unknown requests: ${ids}`);
  }
  return new Map(log.journeys.map((journey) => [journey.requestId, journey]));
};

const toPassengerScore = (requestId: string, times: JourneyTimes): PassengerScore => {
  const breakdown = painBreakdown(times);
  return {
    requestId,
    waitMinutes: msToMinutes(breakdown.waitMs),
    detourMinutes: msToMinutes(breakdown.detourMs),
    painMinutesSquared: painMinutesSquared(breakdown),
  };
};

const journeyTimes = (
  request: RideRequest,
  journey: Journey,
  directTravelTimeMs: number,
): JourneyTimes => ({
  releaseTimeMs: request.requestTimeMs,
  pickupTimeMs: journey.pickupTimeMs,
  dropoffTimeMs: journey.dropoffTimeMs,
  directTravelTimeMs,
});

const scorePassenger = (
  request: RideRequest,
  journey: Journey,
  directTravelTimeMs: number,
  deadlineMs: number,
): Scored<PassengerScore> => {
  const times = journeyTimes(request, journey, directTravelTimeMs);
  const defect = checkJourneyTimes(times);
  if (defect !== undefined) {
    return failure("inconsistentLog", `request "${request.id}": ${defect}`);
  }
  if (journey.dropoffTimeMs > deadlineMs) {
    return failure("deadlineExceeded", `request "${request.id}" dropped off after deadline`);
  }
  return toPassengerScore(request.id, times);
};

const scoreRequest = (
  request: RideRequest,
  journey: Journey | undefined,
  directTravelTimeMs: number | undefined,
  deadlineMs: number,
): Scored<PassengerScore> => {
  if (journey === undefined) {
    return failure("unservedRequests", `request "${request.id}": not served`);
  }
  if (directTravelTimeMs === undefined) {
    return failure("unservedRequests", `request "${request.id}": destination unreachable`);
  }
  return scorePassenger(request, journey, directTravelTimeMs, deadlineMs);
};

const scoreAll = (
  scenario: ScenarioDocument,
  map: MapDocument,
  journeys: ReadonlyMap<string, Journey>,
): Scored<Graded> => {
  const directMs = directTravelTimes(map, scenario.requests);
  const passengers: PassengerScore[] = [];
  for (const request of scenario.requests) {
    const journey = journeys.get(request.id);
    const direct = directMs.get(request.id);
    const scored = scoreRequest(request, journey, direct, scenario.completionDeadlineMs);
    if (isFailure(scored)) {
      return scored;
    }
    passengers.push(scored);
  }
  return { passengers };
};

const summarize = (passengers: readonly PassengerScore[]): ScoreSummary => {
  const delays = passengers.map((passenger) => passenger.waitMinutes + passenger.detourMinutes);
  return {
    meanWaitMinutes: mean(passengers.map((passenger) => passenger.waitMinutes)),
    meanDetourMinutes: mean(passengers.map((passenger) => passenger.detourMinutes)),
    delayP95Minutes: percentileNearestRank(delays, P95),
    delayP99Minutes: percentileNearestRank(delays, P99),
    maxDelayMinutes: maximum(delays),
  };
};

const gradeJourneys = (
  scenario: ScenarioDocument,
  map: MapDocument,
  log: RunLog,
): Scored<Graded> => {
  const provenance = checkProvenance(scenario, map, log);
  if (provenance !== undefined) {
    return provenance;
  }
  if (log.termination.kind === "failed") {
    return failure(log.termination.reason, log.termination.detail);
  }
  const journeys = indexJourneys(scenario, log);
  return isFailure(journeys) ? journeys : scoreAll(scenario, map, journeys);
};

/**
 * Grades a run log independently of the simulator and policy. Every request
 * must be served exactly once, in order, inside the deadline, with a
 * non-negative detour; otherwise the run fails with `pain: null`.
 */
export const scoreRun = (scenario: ScenarioDocument, map: MapDocument, log: RunLog): RunResult => {
  const base: ResultBase = {
    schemaVersion: RUN_RESULT_SCHEMA_VERSION,
    protocolVersion: PROTOCOL_VERSION,
    scenarioId: scenario.id,
    policy: log.policy,
    requestCount: scenario.requests.length,
    completedCount: log.journeys.length,
  };
  const graded = gradeJourneys(scenario, map, log);
  if (isFailure(graded)) {
    return { ...base, status: "failed", pain: null, failure: graded };
  }
  const { passengers } = graded;
  const pain = mean(passengers.map((passenger) => passenger.painMinutesSquared));
  return { ...base, status: "complete", pain, passengers, summary: summarize(passengers) };
};
