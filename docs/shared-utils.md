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

## `@bus20/simulator`

| Module | Exports | Purpose |
| --- | --- | --- |
| `state` | `createInitialState`, `findVehicle`, `nextFreePoint`, `allRequestsCompleted` | Mutable simulator state and its invariants. |
| `routing` | `Routing` | Memoised shortest-path queries (travel time, first edge) on the fixed map. |
| `plan` | `timePlan`, `isPlanDefect` | Walks a stop list checking capacity, reachability, and stop permission; attaches planned arrival times. |
| `candidates` | `enumerateCandidates`, `candidateId` | Every legal insertion of a request into one vehicle's stops, in cost-independent order. |
| `validation` | `validateAction` | Checks `chooseCandidate` and `insert` actions against state; rejections never mutate state. |
| `observation` | `buildObservation` | The legal policy view: released, unfinished requests and host candidates only. |
| `events` | `processArrivals`, `processDropoffs`, `releaseRequests`, `processPickupsAndDepartures`, `nextEventTimeMs` | The five same-timestamp phases of protocol v1. |
| `run` | `runSimulation` | Runs a scenario under a policy and produces a run log with a final state digest. |
| `replay` | `createReplayPolicy`, `verifyReplay` | Replays a log's decisions and checks journeys, termination, and digest agree. |
| `snapshot` | `snapshotState`, `stateDigest` | Canonical state view for replay verification. |
| `policy` | `Policy`, `Decision` | The common `decide(observation)` contract all policies implement. |
| `fixture-policy` | `createFixturePolicy` | Smoke-test baseline (append to earliest pickup); never the Swift reference or AI. |

## `@bus20/runner`

| Module | Exports | Purpose |
| --- | --- | --- |
| `files` | `readJsonFile`, `writeJsonAtomic` | Validated JSON reads and atomic writes via a sibling temporary file. |
| `logging` | `createStderrLogger`, `silentLogger` | Structured JSON logging on stderr; stdout stays free for CLI output. |
| `run-scenario` | `loadInputs`, `runAndScore`, `replayStoredLog`, `createPolicyById` | Load and validate inputs, run, score, verify replay, persist. |
| `cli` | `main` | `bus20-run run` and `bus20-run replay` commands. |

## `@bus20/baselines`

| Module | Exports | Purpose |
| --- | --- | --- |
| `json-lines-client` | `JsonLinesClient` | One long-lived child process; one request line in, one response line out, with timeouts and crash reporting. |
| `swift-reference` | `createSwiftReferencePolicy`, `swiftResponseSchema` | Connects the headless Swift CLI to the policy contract; validates every response line. |

## `@bus20/models`

| Module | Exports | Purpose |
| --- | --- | --- |
| `decision-brief` | `buildDecisionBrief`, `describeCandidate`, `candidateIds`, `assertChoiceFits`, `PROMPT_VERSION`, `MAX_CHOICE_OPTIONS` | The provider-neutral decision state every model receives. |
| `pricing` | `TARIFFS`, `estimateCostUsd`, `usageRecord` | Pinned list prices with retrieval dates; cost per decision. |
| `choose-action` | `chooseCandidateAction` | The `chooseCandidate` action form emitted by model adapters. |
| `choice-client` | `ChoiceClient`, `ChoiceRequest`, `ChoiceReply` | The one structured-choice call every adapter implements. |
| `choice-procedure` | `decideByChoice`, `CHOICE_MODES`, `DEFAULT_CHOICE_SETTINGS`, `DEFAULT_CHUNK_SIZE` | Flat, hierarchical, auto, and tournament decision procedures over a choice client. |
| `choice-client` | `askAll` | Batched choices when the client supports `askMany`, sequential otherwise. |
| `presentation` | `NUMERIC_PRESENTATION`, `CONSEQUENCES_PRESENTATION`, `presentationById` | How observations become choice requests, with prompt version and encoding text. |
| `insertion-rule` (baselines) | `planCostMs2`, `incrementalCosts`, `shortlistByCost` | The Swift insertion rule in TypeScript, exact integer ms². |
| `rollout-world` (baselines) | `worldFromObservation`, `advanceWorld`, `insertGreedily`, `totalCostMs2` | Light forward model for rollouts; never used for scoring. |
| `demand-history` (baselines) | `DemandModel`, `DemandHistory`, `labelSamples` | Empirical demand from the run's own history; interface for other models. |
| `rollout-reference` (baselines) | `createRolloutReferencePolicy`, `DEFAULT_ROLLOUT_SETTINGS` | Shortlist by the rule, score by sampled rollouts; see docs/rollout-reference.md. |
| `demand` (datasets) | `demandDistributionOf`, `sampleDemandDay` | Recover a scenario's generative distribution from provenance and redraw days. |
| `rollout-demand` (runner) | `createKnownDemandModel` | The `known` demand model for the rollout, built per scenario. |
| `decision-diagnosis` (analysis) | `summarizeDecisions`, `diagnosisMarkdown`, `candidateBucket` | Per-decision rank, myopic regret, error direction, and confidence quartiles. |
| `diagnose` (runner) | `diagnoseRun`, `diagnoseSuiteDirectory` | Replay stored runs and score every choice against the insertion rule. |
| `choice-procedure` (shortlist) | `shortlistObservation`, `choiceLabel`, `describeChoice` | Offer only the rule's cheapest insertions; shared descriptor fields. |
| `forecast-presentation` | `createForecastPresentation`, `Forecaster`, `FORECAST_PROMPT_VERSION` | Prompt v5: v4 plus host-computed demand forecasts per option. |
| `forecast` (runner) | `createKnownForecaster`, `DEFAULT_FORECAST_SETTINGS` | Forecasts from the scenario's demand distribution, seeded per decision. |
| `random-shortlist` (baselines) | `createRandomShortlistPolicy` | Floor for shortlisted conditions: uniform choice among the rule's K cheapest, seeded per decision. |
| `laya-policy` | `createLayaPolicy`, `compactOption`, `LAYA_MAX_OPTIONS` | Laya via `@receptron/laya` (local ONNX); one-sentence options, labels A-F, lazy session. |
| `jev-native` | `consequencesOf`, `jevCandidateOption`, `jevVehicleOption`, `jevDecisionState` | Consequences presentation (shared prompt v3): arithmetic in code, words and whole minutes. |
| `self-consistency` | `withSelfConsistency` | Repeated choices with permuted option order, probabilities summed in code. |
| `jev-policy` | `createJevPolicy`, `DEFAULT_JEV_MODEL_ID` | Jev via `@typesafe-ai/sdk` Choice; records confidence and probabilities. |
| `effort` | `EFFORT_LEVELS`, `Effort`, `DEFAULT_EFFORT` | Reasoning effort names shared by the general-LLM adapters. |
| `claude-policy` | `createClaudePolicy`, `DEFAULT_CLAUDE_MODEL_ID` | Claude via `@anthropic-ai/sdk` structured output; records tokens and stop reason. |
| `openai-policy` | `createOpenAIPolicy`, `DEFAULT_OPENAI_MODEL_ID` | OpenAI via the Responses API with a strict JSON schema; same prompt and procedure as Claude. |
| `gemini-policy` | `createGeminiPolicy`, `DEFAULT_GEMINI_MODEL_ID` | Gemini via `@google/genai` JSON output with a response schema; thinking level from the shared effort. |

`@bus20/runner` also gains `compare` (`loadRunDirectory`, `toRow`, `comparisonMarkdown`) and `writeTextAtomic` in `files`.

## `@bus20/datasets`

| Module | Exports | Purpose |
| --- | --- | --- |
| `synthetic-map` | `generateSyntheticMap` | Seeded, strongly connected, city-like grid maps with one-way streets. |
| `demand` | `generateScenario`, `meanDirectTravelMs` | Fixed request sequences: uniform, commute, hotspot; load as target utilisation. |
| `suite-config` | `suiteConfigSchema` | Configuration of a versioned synthetic suite. |
| `build-suite` | `buildSuite`, `mapPath`, `scenarioPath` | Pure config-to-suite build with manifest digests. |
| `files` | `writeSuite`, `loadSuite`, `readManifest`, `writeJsonAtomic` | Suite persistence and full verification. |

`@bus20/contracts` gains `random` (`createRng`, `seedFromLabel`), `manifest`, and `suite-index`.

## `@bus20/analysis`

| Module | Exports | Purpose |
| --- | --- | --- |
| `statistics` | `mean`, `bootstrapMeanInterval` | Seeded percentile bootstrap over scenario-level values. |
| `aggregate` | `summarizeCells`, `summarizePaired`, `summarizeAcrossCities` | Success rates, conditional pain, paired differences, equal-weight city means. |
| `report` | `analyzeSuite`, `analysisMarkdown` | JSON and Markdown paper artifacts. |

`@bus20/runner` gains `suite` (`runSuite`) for paired evaluation with resume.

## `@bus20/transport`

| Module | Exports | Purpose |
| --- | --- | --- |
| `json-lines-client` | `JsonLinesClient` | One child process, ordered request/response lines, timeouts, crash reporting (moved from baselines). |

## `@bus20/policy-runtime`

| Module | Exports | Purpose |
| --- | --- | --- |
| `compile` | `compileProgram`, `DECIDE_FUNCTION` | Static gate (no modules, no host access) and TypeScript stripping. |
| `sandbox` | `ProgramSandbox` | `node:vm` context with frozen globals, seeded random, constant clock, CPU timeouts. |
| `host-protocol` | `hostRequestSchema`, `hostResponseSchema` | JSON Lines contract between parent and program host. |
| `program-host` | (executable) | Child process hosting one program. |
| `program-policy` | `createProgramPolicy`, `DEFAULT_PROGRAM_LIMITS` | Policy adapter over the host process. |

## `@bus20/policy-build`

| Module | Exports | Purpose |
| --- | --- | --- |
| `program-spec` | `PROGRAM_SPEC`, `PROGRAM_PROMPT_VERSION` | The only task description generators receive. |
| `generator` | `ProgramGenerator`, `createClaudeGenerator`, `extractProgram`, `generationTask` | Program generation interface and Claude implementation. |
| `feedback` | `buildFeedback` | Aggregate development feedback for revisions. |
| `evaluate` | `evaluateProgram`, `summarizeRuns` | Runs a program on one split through the suite runner. |
| `selection` | `isImprovement`, `compareForSelection` | Fixed acceptance and selection rules. |
| `campaign` | `runCampaign` | B0, B-restart, and B-self loops with budgets and freezing. |
| `artifacts` | `writeCampaign`, `readCampaign`, `writeProgram`, `readProgram`, `writeEvaluation`, `readEvaluation` | Campaign directory layout. |

`@bus20/contracts` gains `policy-artifact` (programs, evaluations, campaigns); `@bus20/runner` gains `--policy program`.

## Second-paper experiments

| Package / module | Exports | Purpose |
| --- | --- | --- |
| `@bus20/analysis/campaigns` | `analyzeExperiment` | Curves, mode summaries, test comparison, generalisation, amortisation (pure). |
| `@bus20/analysis/campaign-report` | `paper2Markdown` | Markdown artifact for the second paper. |
| `@bus20/policy-build/experiment` | `runExperiment`, `reportExperiment` | Orchestrates campaigns, test evaluations, references, and the report. |
| `@bus20/policy-build/experiment-config` | `experimentConfigSchema` | Experiment configuration file. |
| `@bus20/policy-build/sample-generator` | `createSampleGenerator` | Offline stand-in generator over hand-written sample programs. |
| `@bus20/policy-build/sample-programs` | `SAMPLE_LADDER` | The sample programs (labelled `provider: "sample"`). |

`@bus20/contracts/policy-artifact` gains the experiment index; campaigns gain `excludeCities` and per-iteration `generationCostUsd`; `bus20-run suite` accepts a scenario filter.
