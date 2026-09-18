import assert from "node:assert/strict";
import { test } from "node:test";
import { checkJourneyTimes, painBreakdown, painMinutesSquared } from "../src/pain.js";

const MINUTE = 60000;

test("immediate pickup and direct ride has zero pain", () => {
  const times = {
    releaseTimeMs: 0,
    pickupTimeMs: 0,
    dropoffTimeMs: 5 * MINUTE,
    directTravelTimeMs: 5 * MINUTE,
  };
  assert.equal(checkJourneyTimes(times), undefined);
  const breakdown = painBreakdown(times);
  assert.deepEqual(breakdown, { waitMs: 0, detourMs: 0, delayMs: 0 });
  assert.equal(painMinutesSquared(breakdown), 0);
});

test("two minutes wait plus three minutes detour is pain 25", () => {
  const times = {
    releaseTimeMs: 10 * MINUTE,
    pickupTimeMs: 12 * MINUTE,
    directTravelTimeMs: 7 * MINUTE,
    dropoffTimeMs: 12 * MINUTE + 7 * MINUTE + 3 * MINUTE,
  };
  const breakdown = painBreakdown(times);
  assert.deepEqual(breakdown, { waitMs: 2 * MINUTE, detourMs: 3 * MINUTE, delayMs: 5 * MINUTE });
  assert.equal(painMinutesSquared(breakdown), 25);
  // Identity from the protocol: wait + detour = dropoff − release − direct.
  assert.equal(
    breakdown.delayMs,
    times.dropoffTimeMs - times.releaseTimeMs - times.directTravelTimeMs,
  );
});

test("pain is squared per passenger, so it is not linear in delay", () => {
  const half = painMinutesSquared({ waitMs: MINUTE, detourMs: 0, delayMs: MINUTE });
  const full = painMinutesSquared({ waitMs: MINUTE, detourMs: MINUTE, delayMs: 2 * MINUTE });
  assert.equal(half, 1);
  assert.equal(full, 4);
});

test("journey defects are reported, never clamped", () => {
  assert.equal(
    checkJourneyTimes({
      releaseTimeMs: 10,
      pickupTimeMs: 5,
      dropoffTimeMs: 50,
      directTravelTimeMs: 1,
    }),
    "pickupBeforeRelease",
  );
  assert.equal(
    checkJourneyTimes({
      releaseTimeMs: 0,
      pickupTimeMs: 50,
      dropoffTimeMs: 40,
      directTravelTimeMs: 1,
    }),
    "dropoffBeforePickup",
  );
  assert.equal(
    checkJourneyTimes({
      releaseTimeMs: 0,
      pickupTimeMs: 0,
      dropoffTimeMs: 40,
      directTravelTimeMs: 41,
    }),
    "negativeDetour",
  );
});
