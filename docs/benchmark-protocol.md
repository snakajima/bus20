# Benchmark protocol v1

This is the executable-contract specification for the first paper. The Japanese
[research plan](benchmark_plan_jp.md) describes later experiments as well.

## Environment

- A map is a directed graph with unique node/edge IDs and positive integer edge
  travel times in milliseconds. Coordinate fields are geographic metadata only.
- A scenario supplies a map reference, initial vehicles, fixed requests, a demand
  cutoff, and a completion deadline. One request represents one passenger.
- Every request has distinct, reachable origin and destination nodes. Request
  origins must be reachable from every initial vehicle node. The initial fixture
  uses a strongly connected graph. Vehicles start empty and stationary.
- Travel times are fixed, and boarding/alighting takes zero time. Empty vehicles
  wait in place. There is no cancellation, transfer, rejection, or random movement.
- Only already-released requests are visible to policies. Future requests and
  generator seeds stay inside the host. Policy calls do not advance virtual time.

## Decisions

Policies insert each new passenger's pickup/drop-off into one vehicle's remaining
stop list. Existing assigned stops retain their relative order. Requests with the
same release time are processed by ID, with all of them visible before the first
decision. IDs use locale-independent lexical ordering for all tie-breaking.

Candidates contain a vehicle ID and complete remaining stop list. Each stop,
in candidates and in a vehicle's current commitments, carries the planned
arrival time computed by the host on the fixed graph. The host checks
reachability, capacity throughout the route, pickup before drop-off, no duplicate
service, and preservation of existing commitments before accepting a choice.
Candidates do not carry a pain score or a cost-based ranking.

A moving vehicle must finish its current edge. Replanning applies at that edge's
destination and preserves its arrival time. Shortest-path ties are deterministic.

At each virtual timestamp process edge arrivals, committed drop-offs, and new
request releases; obtain required decisions; then perform pickups and departures.
Stationary vehicles execute zero-distance stops without advancing time. Physical
events scheduled at the completion deadline are allowed to finish before failure
is determined. The last release is followed by draining all remaining passengers.

## Scoring

For each passenger, in minutes:

```text
wait   = pickup - release
ride   = dropoff - pickup
detour = ride - shortest_direct_travel_time
pain   = (wait + detour)^2
```

The scenario score is the mean of individual pain values, in minutes squared.
Direct travel duration uses the same fixed graph and time units. Pickup at time
zero is valid. Negative detours are invalid, not silently clamped. Never average
only the served subset of requests.

A complete run serves every request exactly once. A failed run has `pain: null`
and a reason (conceptually infinite pain), plus its completed/request counts.
Invalid decisions fail without silently substituting a reference action.
Each decision record stores the policy's action, outcome, wall-clock latency,
numeric usage (tokens, cost at a pinned tariff, confidence), and a provider
trace, so runs can be re-scored and audited without calling any API. Initial
protocol v1 has no automatic model retry; any later repair/retry policy must be
explicitly versioned. An empty-demand scenario is rejected at ingestion.

## Scope and milestones

1. Specification and project disciplines (this document).
2. TypeScript tooling, runtime contracts, and independently tested scoring.
3. Deterministic simulation, candidate validation, replay, and offline CLI fixture.
4. Corrected headless Swift reference connected to the common environment.
5. Jev and general-LLM adapters, usage accounting, and fixture comparison.
6. Versioned city datasets, paired evaluation, statistics, and paper artifacts.

Each milestone gets a separate PR. The offline TypeScript fixture policy is only
a smoke-test baseline; it must never be labeled as the Swift reference or as AI.
The second paper's generated-code and self-improvement pipeline is deferred.
