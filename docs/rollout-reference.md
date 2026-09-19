# Rollout reference (a stronger classical baseline)

The Swift insertion rule is myopic: it commits the insertion that adds the
least squared delay right now. The rollout reference (`--policy rollout`,
`@bus20/baselines/rollout-reference`, tool version
`bus20-rollout-reference/1`) looks ahead. It is the classical
sample-average / rollout approach from stochastic dispatching, implemented
in TypeScript on the same policy contract as every other decision-maker.

## What it does per decision

1. **Shortlist.** Rank every offered candidate by the insertion rule's
   incremental cost (`insertion-rule.ts`, exact integer ms², identical to
   the Swift CLI) and keep the cheapest `shortlist` (default 8).
2. **Imagine futures.** Draw `samples` (default 64) futures of the next
   `horizonMinutes` (default 10), clipped to the end of the demand window,
   from a demand model (below). The random stream is seeded by the scenario
   and request ids, never by wall time, so runs are deterministic per
   `seed`.
3. **Roll out.** For each shortlisted candidate and each future, commit the
   candidate in a light forward model (`rollout-world.ts`), serve the
   sampled arrivals with the insertion rule as they come, and total the
   squared delay of everyone, known and sampled. The same futures are used
   for every candidate (common random numbers).
4. **Commit** the candidate with the lowest mean total; ties keep the
   rule's order. With `samples: 0` the policy is exactly the insertion rule,
   which the tests check decision by decision.

The forward model follows shortest paths, lets a vehicle re-plan at the end
of the edge it is on (as the simulator does), and serves stops at their
planned times. It is used only to rank candidates; scoring always comes
from the real simulator.

## Demand models

- **`empirical` (default).** Only what this run has shown so far: arrivals
  as a Poisson process at the rate observed over the last 20 minutes (or the
  whole run when that window holds fewer than five requests), trips
  bootstrapped from the same recent requests. No scenario metadata is used.
- **`known`** (`--rollout-demand known`). The generator's distribution,
  recovered from the scenario's provenance (pattern, seed, hotspot
  parameters; `demandDistributionOf` in `@bus20/datasets/demand`). Each
  sample is a fresh day drawn from that distribution and clipped to the
  horizon, so commute peaks and hotspot bursts fall at their usual times.
  This is what a dispatcher with historical data would have. The stored
  requests of the day being run are never read, and the per-cell request
  count reveals nothing about one day.

Both models, the map, and the demand window are the only information beyond
the observation. Unreleased requests are never consulted; the policy is
subject to the same protocol checks as every other policy and its runs
replay.

## Recorded per decision

`usage`: `candidatesEvaluated`, `shortlisted`, `samples`,
`meanSampledArrivals`, `incrementalCostMs2` and `meanRolloutCostMs2` of the
chosen candidate, and `changedFromMyopic` (1 when the rollout overruled the
rule). `trace`: the rule's choice and the shortlist with both costs.

## Pilot (dev scenarios, one run each unless noted)

Pain in min², Swift is the insertion rule; see `results/pilot/rollout/`.

| scenario | Swift | rollout, empirical | rollout, known | rollout with the true future* |
| --- | --- | --- | --- | --- |
| sf-like-low-dev-01 (dev-1) | 3.37 | 3.05 | 2.80 | – |
| tokyo-like-low-dev-02 (dev-1) | 1.81 | 2.09 | 1.90 | 1.55 |
| nyc-like-medium-dev-01 (dev-1) | 10.22 | 7.14 | 7.51 | 5.92 |
| sf-like-high-dev-01 (dev-2) | 6.34 | 5.63 | 5.63 | – |
| tokyo-like-high-dev-03 (dev-2) | 9.37 | 10.24 | 9.50 (8.6–11.8 over seeds) | 6.02 |

\*Diagnostic only: the rollout given the actual future requests, which is
cheating. It shows the shortlist-and-rollout mechanism has headroom and
that the remaining gap is the demand model, not the forward model.

The rollout wins clearly at low and medium load and is neutral on the
high-load hotspot scenario, where one different early decision changes the
whole day and seed-to-seed spread is as large as the gap to Swift. More
samples mainly reduce that spread; longer horizons did not help. Runtime is
well under a minute for the hardest dev scenario.
