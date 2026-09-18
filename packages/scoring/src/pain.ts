import { msToMinutes } from "@bus20/contracts/time";

/** Integer-millisecond components of one passenger's journey. */
export interface JourneyTimes {
  readonly releaseTimeMs: number;
  readonly pickupTimeMs: number;
  readonly dropoffTimeMs: number;
  readonly directTravelTimeMs: number;
}

export interface PainBreakdown {
  readonly waitMs: number;
  readonly detourMs: number;
  /** wait + detour; equals dropoff − release − direct under fixed travel times. */
  readonly delayMs: number;
}

/** Why a journey cannot be scored. Never clamp silently. */
export type JourneyDefect = "pickupBeforeRelease" | "dropoffBeforePickup" | "negativeDetour";

export const checkJourneyTimes = (times: JourneyTimes): JourneyDefect | undefined => {
  if (times.pickupTimeMs < times.releaseTimeMs) {
    return "pickupBeforeRelease";
  }
  if (times.dropoffTimeMs < times.pickupTimeMs) {
    return "dropoffBeforePickup";
  }
  if (times.dropoffTimeMs - times.pickupTimeMs < times.directTravelTimeMs) {
    return "negativeDetour";
  }
  return undefined;
};

/** Wait, detour, and delay in integer milliseconds. Caller must check defects first. */
export const painBreakdown = (times: JourneyTimes): PainBreakdown => {
  const waitMs = times.pickupTimeMs - times.releaseTimeMs;
  const detourMs = times.dropoffTimeMs - times.pickupTimeMs - times.directTravelTimeMs;
  return { waitMs, detourMs, delayMs: waitMs + detourMs };
};

/** Individual pain in minutes squared: ((wait + detour) in minutes)². */
export const painMinutesSquared = (breakdown: PainBreakdown): number =>
  msToMinutes(breakdown.delayMs) ** 2;
