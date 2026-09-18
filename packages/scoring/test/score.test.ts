import { validateWithSchema } from "@bus20/contracts/json";
import { type Journey } from "@bus20/contracts/run-log";
import { runResultSchema } from "@bus20/contracts/run-result";
import assert from "node:assert/strict";
import { test } from "node:test";
import { directTravelTimes } from "../src/direct-travel.js";
import { scoreRun } from "../src/score.js";
import { loadGridMap, loadSmokeScenario, makeLog, uniformJourneys } from "./fixtures.js";

const MINUTE = 60000;
const scenario = loadSmokeScenario();
const map = loadGridMap();

const expectFailure = (journeys: readonly Journey[], reason: string, detail: RegExp): void => {
  const result = scoreRun(scenario, map, makeLog(scenario, map, journeys));
  assert.equal(result.status, "failed");
  assert.equal(result.pain, null);
  assert.equal(result.failure.reason, reason);
  assert.match(result.failure.detail, detail);
};

test("direct travel times on the fixture match hand calculation", () => {
  const direct = directTravelTimes(map, scenario.requests);
  assert.equal(direct.get("r01"), 2 * MINUTE);
  assert.equal(direct.get("r06"), 5 * MINUTE);
  assert.equal(direct.get("r11"), 150000);
  assert.equal(direct.size, 12);
});

test("hand-computed run: one pain-0, one pain-25, ten pain-1 passengers", () => {
  const journeys = uniformJourneys(scenario, map, MINUTE, 0).map((journey) => {
    if (journey.requestId === "r01") {
      return { ...journey, pickupTimeMs: 0, dropoffTimeMs: 2 * MINUTE };
    }
    if (journey.requestId === "r02") {
      return { ...journey, pickupTimeMs: 2 * MINUTE, dropoffTimeMs: 7 * MINUTE };
    }
    return journey;
  });
  const result = scoreRun(scenario, map, makeLog(scenario, map, journeys));
  assert.equal(result.status, "complete");
  assert.equal(result.requestCount, 12);
  assert.equal(result.completedCount, 12);
  assert.equal(result.pain, 35 / 12);
  const byId = new Map(result.passengers.map((passenger) => [passenger.requestId, passenger]));
  assert.deepEqual(byId.get("r02"), {
    requestId: "r02",
    waitMinutes: 2,
    detourMinutes: 3,
    painMinutesSquared: 25,
  });
  assert.equal(byId.get("r01")?.painMinutesSquared, 0);
  assert.equal(result.summary.maxDelayMinutes, 5);
  assert.equal(result.summary.delayP95Minutes, 5);
  assert.equal(result.summary.meanWaitMinutes, (2 + 10) / 12);
  assert.equal(result.summary.meanDetourMinutes, 3 / 12);
  assert.equal(validateWithSchema(runResultSchema, result).ok, true);
});

test("pain is the mean of squares, not the square of the mean", () => {
  const journeys = uniformJourneys(scenario, map, 0, 0).map((journey, index) =>
    index === 0 ? { ...journey, dropoffTimeMs: journey.dropoffTimeMs + 12 * MINUTE } : journey,
  );
  const result = scoreRun(scenario, map, makeLog(scenario, map, journeys));
  assert.equal(result.status, "complete");
  assert.equal(result.pain, 144 / 12);
  assert.equal(result.summary.meanDetourMinutes, 1);
});

test("wait + detour equals dropoff − release − direct for every passenger", () => {
  const journeys = uniformJourneys(scenario, map, 3 * MINUTE, 90000);
  const direct = directTravelTimes(map, scenario.requests);
  const result = scoreRun(scenario, map, makeLog(scenario, map, journeys));
  assert.equal(result.status, "complete");
  for (const passenger of result.passengers) {
    const journey = journeys.find((item) => item.requestId === passenger.requestId);
    const request = scenario.requests.find((item) => item.id === passenger.requestId);
    const expectedDelayMs =
      (journey?.dropoffTimeMs ?? 0) -
      (request?.requestTimeMs ?? 0) -
      (direct.get(passenger.requestId) ?? 0);
    assert.equal((passenger.waitMinutes + passenger.detourMinutes) * MINUTE, expectedDelayMs);
    assert.equal(passenger.painMinutesSquared, 4.5 ** 2);
  }
});

test("unserved requests fail the run instead of averaging the served subset", () => {
  const journeys = uniformJourneys(scenario, map, 0, 0).slice(1);
  expectFailure(journeys, "unservedRequests", /request "r01": not served/);
  const result = scoreRun(scenario, map, makeLog(scenario, map, journeys));
  assert.equal(result.completedCount, 11);
  assert.equal(result.requestCount, 12);
});

test("log defects fail the run: duplicate service, unknown request, negative detour, early pickup", () => {
  const journeys = uniformJourneys(scenario, map, 0, 0);
  expectFailure([...journeys, ...journeys.slice(0, 1)], "inconsistentLog", /served twice: r01/);
  expectFailure(
    [...journeys, { requestId: "r99", vehicleId: "v1", pickupTimeMs: 0, dropoffTimeMs: 1 }],
    "inconsistentLog",
    /unknown requests: r99/,
  );
  const shortRide = journeys.map((journey) =>
    journey.requestId === "r05"
      ? { ...journey, dropoffTimeMs: journey.dropoffTimeMs - 1 }
      : journey,
  );
  expectFailure(shortRide, "inconsistentLog", /"r05": negativeDetour/);
  const earlyPickup = journeys.map((journey) =>
    journey.requestId === "r03" ? { ...journey, pickupTimeMs: journey.pickupTimeMs - 1 } : journey,
  );
  expectFailure(earlyPickup, "inconsistentLog", /"r03": pickupBeforeRelease/);
});

test("drop-off after the completion deadline fails the run", () => {
  const journeys = uniformJourneys(scenario, map, 0, 0).map((journey) =>
    journey.requestId === "r12"
      ? { ...journey, dropoffTimeMs: scenario.completionDeadlineMs + 1 }
      : journey,
  );
  expectFailure(journeys, "deadlineExceeded", /"r12"/);
  const atDeadline = uniformJourneys(scenario, map, 0, 0).map((journey) =>
    journey.requestId === "r12"
      ? { ...journey, dropoffTimeMs: scenario.completionDeadlineMs }
      : journey,
  );
  assert.equal(scoreRun(scenario, map, makeLog(scenario, map, atDeadline)).status, "complete");
});

test("a run the host terminated as failed keeps its reason and null pain", () => {
  const log = makeLog(scenario, map, uniformJourneys(scenario, map, 0, 0), {
    kind: "failed",
    finalTimeMs: 100,
    reason: "invalidAction",
    detail: "capacity exceeded on v1",
  });
  const result = scoreRun(scenario, map, log);
  assert.deepEqual(result.status === "failed" ? result.failure : undefined, {
    reason: "invalidAction",
    detail: "capacity exceeded on v1",
  });
  assert.equal(result.pain, null);
});

test("logs from a different scenario or map are rejected as inconsistent", () => {
  const log = makeLog(scenario, map, uniformJourneys(scenario, map, 0, 0));
  const otherMap = { ...map, id: "other" };
  const result = scoreRun(scenario, otherMap, log);
  assert.equal(result.status, "failed");
  assert.equal(result.failure.reason, "inconsistentLog");
  assert.match(result.failure.detail, /mapDigest/);
  const renamed = { ...log, scenarioId: "someone-else" };
  const mismatch = scoreRun(scenario, map, renamed);
  assert.match(mismatch.status === "failed" ? mismatch.failure.detail : "", /scenarioId/);
});
