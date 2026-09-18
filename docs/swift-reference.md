# Swift insertion reference (headless)

The first paper uses the original Swift dispatch logic as a human-written
reference. This document records how it was extracted from the UIKit app in
`bus20/`, which defects were corrected, and which behaviours changed because
the common environment now owns the simulation. Fixes and semantic changes
are listed separately so that numbers from the original app are never
presented as reference scores.

## What the original did

- `Shuttle.plans` enumerated every insertion of a new rider's pickup and
  drop-off into a shuttle's remaining route sections.
- `Evaluator` summed, for every rider of that shuttle, the square of
  `waitTime + rideTime − directLength`, adding a large penalty when capacity was
  exceeded.
- `Shuttle.bestPlan` chose the smallest `cost − costBasis` across shuttles,
  where `costBasis` was the shuttle's cost without the new rider.

## Headless architecture

`swift/` is a Swift package with two targets:

- `Bus20Core` holds the scoring rule (`Evaluator`, `Reference`) and the
  Codable mirror of the observation contract.
- `bus20-baseline` is a JSON Lines CLI. Each stdin line is
  `{"type":"decide","observation":{...}}`; each stdout line is
  `{"type":"action","action":{...},"diagnostics":{...}}` or
  `{"type":"error","message":"..."}`. It keeps no clock and no state.

The TypeScript host enumerates the same insertions as candidates, with
planned arrival times computed on the fixed graph, and validates the chosen
candidate before applying it. `@bus20/baselines` connects the CLI to the
common `decide(observation)` contract and records the CLI's reported
incremental cost in the decision's `usage`.

Build and run:

```sh
yarn build:swift            # swift build -c release
yarn test:swift             # XCTest
node packages/runner/dist/src/cli.js run --policy swift \
  --swift-cli swift/.build/release/bus20-baseline \
  --scenario datasets/fixtures/scenarios/smoke/smoke-01.json \
  --map datasets/fixtures/maps/grid3x3/v1/map.json --out out/smoke-swift
```

## Defects corrected

1. **Double-counted first ride segment.** In `Evaluator.process` the pickup
   check read a stale copy of the rider state, so the segment right after
   pickup was added to both wait and ride time. Under fixed travel times the
   intended quantity is the delay against a direct trip. The reference now
   scores each rider as `(dropoff − release − direct)²`, which equals the
   benchmark's passenger pain.
2. **Moving vehicles evaluated with the full current edge.** The host now
   times every plan from the vehicle's next free point: its node when
   stationary, or the end of its current edge at the recorded arrival time.
3. **Concurrent mutation of `Graph` and `plansArray`.** The CLI is single
   threaded and stateless; shortest paths live in the host.
4. **Manual riders and event order.** Release times and same-timestamp
   ordering are fixed by the protocol and enforced by the host.
5. **Missing validation.** Maps, scenarios, capacity, stop order, and
   reachability are validated by the host before any decision.

## Semantic changes (not defects)

- **Capacity.** The original allowed over-capacity plans with a penalty of
  `1e10`. The environment rejects them, so the reference never sees them.
- **Idle vehicles.** The original started a random walk when a shuttle had no
  riders. Protocol v1 keeps empty vehicles in place.
- **Ties.** The original sorted plans by cost and took the first, with an
  unstable sort. The reference takes the first minimal candidate in host
  order, which is `(vehicle ID, pickup index, drop-off index)`.
- **Units.** Costs are exact integer ms² so ties are exact; the original used
  floating-point route lengths.

## Verification

- XCTest covers the pain formula, the cross-vehicle minimum with a tie, and
  the JSON Lines round trip.
- `@bus20/baselines` tests run the smoke scenario under the CLI and under an
  independent TypeScript statement of the same rule, written from this
  document rather than from the Swift source, and require identical actions,
  identical incremental costs, and identical journeys. A second test checks
  each CLI choice against the exhaustive minimum over all offered candidates.
