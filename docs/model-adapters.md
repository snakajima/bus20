# Model adapters (track C, common candidate choice)

`@bus20/models` connects online decision-makers to the common
`decide(observation)` contract. This document records what every model
receives, what is stored per decision, and the accounting rules, so that a
paper can name the exact "model + prompt + tools + budget" that was evaluated.

## What every model receives

`buildDecisionBrief(observation)` produces one provider-neutral JSON object:
the objective text, the current virtual time, the deciding request, every
released and unfinished request with its direct travel time, every vehicle
with capacity, position, riders on board and committed stops with planned
arrival times, and every legal candidate with its full stop list and planned
arrival times. Times are minutes for readability. The brief is versioned as
`PROMPT_VERSION` (`bus20-prompt/1`) and stored in the run log's policy
descriptor. The brief never contains unreleased requests, pain values, cost
ranks, or the Swift reference's choice.

- **Jev** (`@typesafe-ai/sdk`, `jev-1.13.0` pinned; never `jev-latest`):
  the brief is the `state`, and one `choice` question offers the candidate IDs
  as options with each candidate's stop list as the option description. The
  answer's `choice` becomes a `chooseCandidate` action.
- **Claude** (`@anthropic-ai/sdk`, `claude-opus-5` by default): the brief is
  the single user message, the objective is the system prompt, and structured
  output constrains the reply to `{"candidateId": <enum of offered ids>}`.
  Adaptive thinking is the model default and is not overridden; `effort` is a
  recorded setting (`--effort`).

Neither adapter is given tools, memory across decisions, or extra features.
More than 255 candidates (Jev's Choice limit) fails the decision instead of
pruning; the first common suite must fit this limit.

## What is recorded per decision

`DecisionRecord.usage` (numbers): `inputTokens`, `outputTokens`,
`cacheReadTokens` (Claude), `costUsd` at the pinned tariff, `confidence` and
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

API keys come from `ANTHROPIC_API_KEY` and `TYPESAFE_API_KEY`. They are read
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
- Paid pilot runs. All adapter tests use injected transports; no live API call
  has been made from this repository.
