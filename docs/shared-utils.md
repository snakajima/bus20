# Shared utilities

Check this catalog before adding cross-cutting helpers. Add an entry in the same
PR as a new helper. Keep domain-specific logic in its domain module.

Packages export individual modules by subpath (for example
`@bus20/contracts/ids`); there are no re-export barrels.

## `@bus20/contracts`

| Module | Exports | Purpose |
| --- | --- | --- |
| `result` | `Result`, `Issue`, `ok`, `fail`, `issue`, `formatIssues` | Boundary validation results that carry every issue instead of throwing. |
| `ids` | `compareIds`, `sortIds`, `findDuplicateIds` | Locale-independent code-point ordering used for all tie-breaking. |
| `time` | `MS_PER_MINUTE`, `msToMinutes`, `isTimestampMs` | Named time units; simulation time is integer milliseconds. |
| `versions` | `PROTOCOL_VERSION`, `*_SCHEMA_VERSION` | Pinned schema identifiers for every persisted document. |
| `json` | `parseJsonText`, `validateWithSchema`, `parseJsonWithSchema` | The only sanctioned way to turn untrusted JSON into typed values. |
| `digest` | `canonicalJson`, `digestDocument` | Content digests (`sha256:<hex>`) over canonical JSON, independent of key order. |
| `map` | `mapDocumentSchema`, `validateMapDocument`, `checkMapSemantics` | Directed road graph document and its semantic checks. |
| `scenario` | `scenarioDocumentSchema`, `validateScenarioDocument`, `sortRequestsByRelease` | Fixed demand, vehicles, deadlines, and release order. |
| `stops`, `observation`, `action` | Zod schemas and inferred types | Policy-facing observation, candidate, and action contracts. |
| `run-log`, `run-result` | Zod schemas and inferred types | Scorer input (journeys, decisions, termination) and official score output. |

## `@bus20/graph`

| Module | Exports | Purpose |
| --- | --- | --- |
| `heap` | `MinHeap` | Binary min-heap with an injectable comparator. |
| `graph` | `buildGraph` | Adjacency view of a validated map with sorted edge lists. |
| `shortest-path` | `shortestPathsFrom`, `travelTimeTo`, `pathEdgesTo`, `reachableFrom` | Deterministic Dijkstra; ties resolve by node ID, then edge ID. |
| `scenario-check` | `checkScenarioOnMap` | Cross-document checks: digest match, stop permission, reachability. |

## `@bus20/scoring`

| Module | Exports | Purpose |
| --- | --- | --- |
| `pain` | `checkJourneyTimes`, `painBreakdown`, `painMinutesSquared` | Per-passenger wait, detour, and squared pain. |
| `statistics` | `mean`, `maximum`, `percentileNearestRank` | Summary statistics for score reports. |
| `direct-travel` | `directTravelTimes` | Shortest direct travel time per request, one Dijkstra per origin. |
| `score` | `scoreRun` | Grades a run log against scenario and map without trusting the policy. |
