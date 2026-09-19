import { type Observation } from "@bus20/contracts/observation";
import { type Rng } from "@bus20/contracts/random";
import { MS_PER_MINUTE } from "@bus20/contracts/time";

/**
 * Empirical demand model built only from requests the policy has already
 * seen in this run. Arrivals are a Poisson process at the observed rate;
 * origin-destination pairs are drawn from the history with replacement, so
 * commute and hotspot structure carries over without being told. Nothing
 * unreleased is ever consulted.
 */
export interface SeenRequest {
  readonly requestTimeMs: number;
  readonly originNodeId: string;
  readonly destinationNodeId: string;
}

export interface SampledRequest extends SeenRequest {
  readonly id: string;
}

/** Anything that can imagine the next stretch of demand for a rollout. */
export interface DemandModel {
  /** Short label recorded in the policy descriptor. */
  readonly label: string;
  /** Sees every observation before a decision; empirical models learn from it. */
  observe(observation: Observation): void;
  /** Sampled arrivals in (nowMs, untilMs], in release order, with synthetic ids. */
  sampleFuture(rng: Rng, nowMs: number, untilMs: number): SampledRequest[];
}

export const SAMPLE_ID_PREFIX = "~s";

/** Gives sampled trips their synthetic ids in release order. */
export const labelSamples = (trips: readonly SeenRequest[]): SampledRequest[] =>
  trips.map((trip, index) => ({ ...trip, id: `${SAMPLE_ID_PREFIX}${index + 1}` }));

/** Elapsed time is floored so the first few requests do not imply an absurd rate. */
const MIN_ELAPSED_MS = 5 * MS_PER_MINUTE;
/** Recent window that the rate and the trip bootstrap prefer, so bursts are tracked. */
export const RECENT_WINDOW_MS = 20 * MS_PER_MINUTE;
/** Below this many recent requests the whole history is used instead. */
const MIN_RECENT = 5;
export const EMPIRICAL_DEMAND_LABEL = "empirical";

/** Poisson process: exponential gaps at `ratePerMs`, rounded up to whole milliseconds. */
const arrivalTimes = (rng: Rng, ratePerMs: number, fromMs: number, untilMs: number): number[] => {
  const times: number[] = [];
  for (let timeMs = fromMs; ;) {
    timeMs += Math.ceil(-Math.log(1 - rng.next()) / ratePerMs);
    if (timeMs > untilMs) {
      return times;
    }
    times.push(timeMs);
  }
};

export class DemandHistory implements DemandModel {
  readonly label = EMPIRICAL_DEMAND_LABEL;
  private readonly seen = new Map<string, SeenRequest>();
  private firstSeenMs: number | undefined;

  /** Records every released request in the observation (idempotent). */
  observe(observation: Observation): void {
    for (const request of observation.requests) {
      if (!this.seen.has(request.id)) {
        this.seen.set(request.id, request);
        this.firstSeenMs = Math.min(
          this.firstSeenMs ?? request.requestTimeMs,
          request.requestTimeMs,
        );
      }
    }
  }

  get count(): number {
    return this.seen.size;
  }

  /** Requests seen in the recent window, or everything when the window is too thin. */
  private recent(nowMs: number): SeenRequest[] {
    const all = [...this.seen.values()];
    const recent = all.filter((request) => request.requestTimeMs > nowMs - RECENT_WINDOW_MS);
    return recent.length >= MIN_RECENT ? recent : all;
  }

  /** Requests per millisecond over the window the recent set spans, floored at five minutes. */
  ratePerMs(nowMs: number): number {
    const recent = this.recent(nowMs);
    const span =
      recent.length === this.seen.size ? nowMs - (this.firstSeenMs ?? nowMs) : RECENT_WINDOW_MS;
    return recent.length / Math.max(MIN_ELAPSED_MS, span);
  }

  /** One sampled future: Poisson arrivals in (nowMs, untilMs], trips bootstrapped from recent history. */
  sampleFuture(rng: Rng, nowMs: number, untilMs: number): SampledRequest[] {
    const history = this.recent(nowMs);
    const rate = this.ratePerMs(nowMs);
    if (history.length === 0 || rate <= 0 || untilMs <= nowMs) {
      return [];
    }
    return labelSamples(
      arrivalTimes(rng, rate, nowMs, untilMs).map((timeMs) => ({
        ...rng.pick(history),
        requestTimeMs: timeMs,
      })),
    );
  }
}
