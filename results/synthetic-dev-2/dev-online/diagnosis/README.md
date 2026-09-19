# Decision diagnosis of the dev-split runs (2026-09-19)

`bus20-run diagnose` replayed all 486 runs (24,192 decisions) and scored
every choice against the insertion rule: rank of the chosen candidate,
myopic regret (immediate squared delay given away against the rule's
cheapest insertion, min²), and the direction of the error. Full tables in
`diagnosis.md`; per-decision records are regenerable from the run logs.

## What the models do

| policy | rule's best chosen | top 3 | mean regret | p90 regret | normalized rank |
| --- | --- | --- | --- | --- | --- |
| Rollout (known demand) | 75.5% | 96.3% | 1.24 | 3.4 | 0.03 |
| Claude opus-5, low | 69.0% | 90.7% | 3.60 | 8.6 | 0.03 |
| Gemini 3.8 Flash, low | 70.0% | 91.1% | 3.41 | 7.0 | 0.03 |
| GPT-5.6 Sol, low | 66.3% | 88.1% | 4.83 | 13.7 | 0.04 |
| Jev 1.13.0 | 62.0% | 83.0% | 13.41 | 24.1 | 0.06 |

Normalized rank 0.5 would be uniform random choice; every model is far
from random. The models mostly agree with the rule and differ in the tail:
the rollout's deviations are cheap (it overrules the rule deliberately,
with lookahead), the LLMs' are moderately expensive, Jev's are large.

## The choice set size is the driver

| candidates offered | Claude best / regret | Gemini | OpenAI | Jev |
| --- | --- | --- | --- | --- |
| 1-10 | 75% / 0.34 | 77% / 0.29 | 77% / 0.30 | 77% / 0.39 |
| 11-40 | 75% / 1.69 | 76% / 1.33 | 71% / 2.41 | 66% / 4.05 |
| 41-100 | 54% / 9.9 | 55% / 9.1 | 51% / 12.1 | 47% / 31.0 |
| 101+ | 38% / 14.4 | 56% / 14.8 | 14% / 27.5 | 36% / 82.6 |

With ten or fewer options every model, Jev included, is indistinguishable
from the others and nearly as good as the rule. Quality falls with the
number of options for all of them, fastest for Jev. Decisions with more
than 40 candidates are 25 to 30% of decisions but 74 to 84% of the models'
total regret (53% for the rollout).

## Everyone errs in the same direction

Chosen minus best, averaged over all decisions: wait for the new passenger
-0.25 to -0.38 minutes, passengers delayed +0.19 to +0.36, largest delay to
others +0.19 to +0.34 minutes; near zero for the rollout. When the models
deviate from the rule, they favour the new passenger over the ones already
assigned, and the tendency grows with load. It is the same bias for all
four models, strongest in Jev and OpenAI.

## Jev's confidence is a strong signal

| Jev confidence quartile | rule's best chosen | mean regret | p90 regret |
| --- | --- | --- | --- |
| q4 (highest) | 93.7% | 0.38 | 0.0 |
| q3 | 70.2% | 3.9 | 5.1 |
| q2 | 49.0% | 14.6 | 26.6 |
| q1 (lowest) | 37.6% | 33.3 | 89.5 |

In its most confident quarter Jev is better than any LLM on average; in its
least confident quarter it is close to a coin flip among the top options and
carries most of its regret. This is the basis for a cascade: Jev decides
when confident and hands the rest to a stronger decider.
