# synthetic-dev/2, dev split: Jev with prompt v3 vs v4 (2026-09-19)

Prompt version 4 (`--presentation cumulative`, `bus20-prompt/4`) adds to
every option how late each delayed passenger already is, and says that
adding delay to someone already late costs far more because delays are
squared. Version 3 showed only the added minutes. The insertion rule has
always had this information; the models had not. Same 27 dev scenarios,
three repetitions, Jev tournament, all 162 Jev runs complete.

Equal-weight pain over cities (min², lower is better):

| load | Swift | Jev v3 | Jev v4 |
| --- | --- | --- | --- |
| low | 3.78 | 5.67 | **4.39** (-23%) |
| medium | 9.40 | 20.90 | **17.25** (-17%) |
| high | 13.60 | 36.40 | 37.11 (+2%) |

Decision diagnosis (`diagnosis/`), all 4,032 decisions per prompt:

| | rule's best | top 3 | mean regret | p90 | wait bias | others delayed bias |
| --- | --- | --- | --- | --- | --- | --- |
| Jev v3 | 62.0% | 83.0% | 13.4 | 24.1 | -0.38 | +0.36 |
| Jev v4 | 65.9% | 86.4% | 10.4 | 15.6 | -0.10 | +0.15 |

The information does what it was meant to do: the bias toward the new
passenger shrinks by two thirds and regret falls at every choice-set size.
It does not touch the high-load result, because there the loss comes from
choice sets of 41 or more candidates (v4: 51% best at 41-100, 42% at
101+, regret 23 and 57), which no amount of per-option information fixes.
Per-cell paired results against Swift in `analysis/analysis.md`; Jev v4
wins 8 of 81 pairs (v3: 2).
