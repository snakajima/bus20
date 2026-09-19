# synthetic-dev/2, dev split: every online policy (2026-09-19)

27 dev scenarios (three cities x three loads x three patterns), three
repetitions, 486 runs, all complete and replaying. One suite index and one
analysis for the whole table; run logs stay in `out/`.

Policies, all with the shared prompt `bus20-prompt/3` (consequences
presentation) where a prompt applies:

- `swift-insertion-reference`: the human-written insertion rule.
- `rollout-reference:known:k8:s64:h10`: rollout over the rule with the
  generator's demand distribution; repetition `r` uses seed `r`.
- `claude:claude-opus-5:low:consequences:flat`, `openai:gpt-5.6-sol:low:consequences:flat`,
  `gemini:gemini-3.8-flash:low:consequences:flat`: general LLMs at low
  effort, one flat choice per decision (at most 200 candidates).
- `jev:jev-1.13.0:consequences:tournament:x1`: Jev with its tournament
  procedure (flat up to 180 candidates, chunks of 120 then a final).

Equal-weight pain over cities (min², lower is better), total cost over the
81 runs, and median decision latency:

| policy | low | medium | high | cost | latency |
| --- | --- | --- | --- | --- | --- |
| Swift insertion rule | 3.78 | 9.40 | 13.60 | $0 | <1 ms |
| Rollout (known demand) | **3.28** | **8.35** | **11.37** | $0 | 0.1 s |
| Claude opus-5, low | 3.77 | 13.27 | 17.99 | $107 | 2.3 s |
| Gemini 3.8 Flash, low | 4.30 | 13.62 | 19.07 | $17 | 1.6 s |
| GPT-5.6 Sol, low | 4.68 | 15.75 | 20.47 | $42 | 2.8 s |
| Jev 1.13.0 | 5.67 | 20.90 | 36.40 | $0.77 | 0.14 s |

Paired against Swift (9 pairs per city x load cell): the rollout wins 6 to
9 of 9 in every cell; Claude wins 13 of 27 at low load and 13 of 54 at
medium and high; Gemini and OpenAI win a quarter or fewer; Jev wins 2 of
81. The gap to Swift widens with load for every model. Full tables with
bootstrap intervals in `analysis/analysis.md`.
