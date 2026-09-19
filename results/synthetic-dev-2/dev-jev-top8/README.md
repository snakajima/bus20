# synthetic-dev/2, dev split: Jev choosing among the rule's eight cheapest insertions (2026-09-19)

`--presentation cumulative --shortlist 8`: the host offers Jev only the
eight insertions the insertion rule rates cheapest (host order, costs not
shown), with prompt version 4. Same 27 dev scenarios, three repetitions,
all runs complete. The index also carries Swift and the two full-set Jev
conditions for comparison.

Equal-weight pain over cities (min², lower is better):

| load | Swift | Jev v3, full set | Jev v4, full set | Jev v4, top 8 |
| --- | --- | --- | --- | --- |
| low | 3.78 | 5.67 | 4.39 | **3.99** |
| medium | 9.40 | 20.90 | 17.25 | **11.89** |
| high | 13.60 | 36.40 | 37.11 | **17.40** |

For reference, the general LLMs on the full set with prompt v3 at low
effort scored 3.77 / 13.27 / 17.99 (Claude), 4.30 / 13.62 / 19.07
(Gemini), 4.68 / 15.75 / 20.47 (OpenAI). Jev with the shortlist is now the
best model at medium and high load, at $0.28 for the 81 runs (Claude:
$107) and 131 ms per decision.

Decision diagnosis (`diagnosis/`): rule's best 72.6% (v3 full set: 62.0%),
top 3 94.4%, mean regret 1.66 (v3: 13.4), p90 5.0 (v3: 24.1), biases
within ±0.1. The choice set, not the model, was the limiting factor.

Paired against Swift, Jev top 8 wins 16 of 81 (v3: 2), with the 95%
interval of the difference excluding zero against it in six of nine
cells; the gap is 5% at low load and 26 to 28% at medium and high.
