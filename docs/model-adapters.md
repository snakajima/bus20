# Model adapters (track C, common candidate choice)

`@bus20/models` connects online decision-makers to the common
`decide(observation)` contract. This document records what every model
receives, what is stored per decision, and the accounting rules, so that a
paper can name the exact "model + prompt + tools + budget" that was evaluated.

## What every model receives

`buildDecisionState(observation)` produces one provider-neutral JSON object:
the objective text, the current virtual time, the deciding request, every
released and unfinished request with its direct travel time, and every
vehicle with capacity, position, riders on board and committed stops with
planned arrival times, listed exactly once. Candidates are encoded compactly
(`describeCandidate`): the vehicle, the pickup and drop-off insertion
indices, the new passenger's planned pickup and drop-off times, and two
shifts that say how much later the vehicle's existing stops become (between
the two insertions, and after the drop-off). Under fixed travel times those
two constants describe the whole consequence for existing passengers, so a
candidate costs O(1) tokens instead of O(stops). Times are minutes. The
brief is versioned as `PROMPT_VERSION` (`bus20-prompt/2`; version 1
repeated full stop lists per candidate) and stored in the run log's policy
descriptor. The brief never contains unreleased requests, pain values, cost
ranks, or the Swift reference's choice.

Every adapter implements one narrow contract, `ChoiceClient.ask`, which
answers a structured choice (state, question, options). The decision
procedure (`decideByChoice`) composes calls in one of three modes, recorded
in the descriptor as `choiceMode` and `flatLimit`:

- `flat`: one call offering every candidate.
- `hierarchical`: one call choosing a vehicle among those with at least one
  legal insertion (each described by its committed stops, the number of
  legal insertions, and its earliest possible pickup), then one call
  choosing the insertion within it. A single eligible vehicle skips the first
  stage. Each stage's usage and trace is kept; `stages` records the count.
- `auto` (default, `flatLimit` 40): flat when at most `flatLimit` candidates
  are offered, hierarchical otherwise.

Jev's 255-option limit applies per stage.

Both Claude and Jev default to the `consequences` presentation (shared
prompt `bus20-prompt/3`, see [docs/jev-native.md](jev-native.md)); the older
`numeric` form (`bus20-prompt/2`) stays selectable with
`--presentation consequences|numeric`. Jev also accepts self-consistency with
`--repeats N`. Presentation and repeats are recorded in the descriptor, and
the prompt version follows the presentation.

- **Jev** (`@typesafe-ai/sdk`, `jev-1.13.0` pinned; never `jev-latest`):
  the brief is the `state`, and one `choice` question offers the candidate IDs
  as options with each candidate's stop list as the option description. The
  answer's `choice` becomes a `chooseCandidate` action.
- **Claude** (`@anthropic-ai/sdk`, `claude-opus-5` by default): the brief is
  the single user message, the objective is the system prompt, and structured
  output constrains the reply to `{"candidateId": <enum of offered ids>}`.
  Adaptive thinking is the model default and is not overridden; `effort` is a
  recorded setting (`--effort`, default `low` so pilots stay cheap;
  experiments set it explicitly).
- **OpenAI** (`openai` SDK, Responses API, `gpt-5.6-sol` by default; the
  model priced next to `claude-opus-5`, with `gpt-6-astra` selectable via
  `--model`): the same instruction text as Claude's system prompt goes in
  `instructions`, the same JSON message in `input`, and a strict JSON schema
  constrains the reply to the offered ids. `reasoning.effort` takes the same
  `--effort` value; `store` is off. Refusals and incomplete responses fail
  the decision.
- **Gemini** (`@google/genai`, `gemini-3.8-flash` by default, the newest
  stable Gemini at pinning time; `gemini-3.1-pro-preview` selectable via
  `--model`): the same instruction text as `systemInstruction`, the same
  JSON message as the user content, and `responseJsonSchema` with
  `application/json` output constrains the reply to the offered ids. The
  shared `--effort` maps to `thinkingConfig.thinkingLevel` (low → LOW,
  medium → MEDIUM, high and above → HIGH), recorded as `thinkingLevel`.
  Thinking tokens are billed as output and are added to `outputTokens`, with
  the count kept separately as `thoughtTokens`. A blocked prompt or any
  finish reason other than STOP fails the decision.

No adapter is given tools, memory across decisions, or extra features.
More than 255 candidates (Jev's Choice limit) fails the decision instead of
pruning; the first common suite must fit this limit.

## What is recorded per decision

`DecisionRecord.usage` (numbers): `inputTokens`, `outputTokens`,
`cacheReadTokens` (Claude, OpenAI, Gemini), `thoughtTokens` (Gemini), `costUsd` at the pinned tariff, `confidence` and
`chosenProbability` (Jev), and `candidatesOffered`. `DecisionRecord.trace`
(JSON): provider, the model ID the API reported, the raw reply text or the
full probability distribution, and the response ID. Wall-clock latency is
measured by the host and never added to virtual time.

Confidence and probabilities are descriptive only. They are never treated as
pain estimates and do not trigger any switch to another model.

## Failure and retry rules

- A refusal, a `max_tokens` stop, non-JSON output, or an ID outside the offered
  set is a `policyError`; the run fails and is kept as data.
- No server-side model fallback is enabled. A fallback would silently change
  the evaluated model.
- Transport retries are fixed and recorded in the descriptor's `settings`
  (`maxRetries`, default 2 for 408/429/5xx and connection errors, matching
  both SDKs' defaults). Retried attempts cost real money; tokens reported by
  the final successful response are what gets recorded.
- Timeouts are per attempt (`timeoutMs`) and recorded.

## Pricing

`pricing.ts` pins list prices with a retrieval date and source. Unknown models
get no cost rather than an estimate. Update the table and the date together;
results must state the tariff date they used.

## Running

API keys come from `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, and
`TYPESAFE_API_KEY`. They are read
by the SDKs and never logged or written to run logs.

```sh
node packages/runner/dist/src/cli.js run --policy jev \
  --scenario datasets/fixtures/scenarios/smoke/smoke-01.json \
  --map datasets/fixtures/maps/grid3x3/v1/map.json --out out/smoke-jev
node packages/runner/dist/src/cli.js run --policy claude --effort medium \
  --scenario ... --map ... --out out/smoke-claude
node packages/runner/dist/src/cli.js compare out/smoke-fixture out/smoke-swift \
  out/smoke-jev out/smoke-claude --markdown out/comparison.md
```

`compare` prints one row per run with status, pain, served count, decision
count, latency p50/p95, tokens, and cost. Failed runs stay visible with pain
`n/a`; nothing averages them away.

## Not yet covered

- OpenAI and Gemini adapters (same brief, same structured choice).
- The tool-use track (`get_travel_times`, `list_insertions`, ...) and any
  host-side computation accounting for it.
- Paid experiments. Adapter tests use injected transports. The only live
  calls so far are the smoke pilots recorded under `results/pilot/smoke/`.
