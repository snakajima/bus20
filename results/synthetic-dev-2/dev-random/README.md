# synthetic-dev/2, dev split: random choice from the rule's top 8 and from every insertion (2026-09-19)

`--policy random --shortlist 8` picks uniformly at random among the
insertion rule's eight cheapest insertions; `--policy random` picks among
every legal insertion. Seeded per decision, repetition `r` uses seed `r`.
27 dev scenarios, three repetitions. The index also carries Swift and the
Jev and Gemini top-8 conditions (prompt v4) for comparison.

Equal-weight pain over cities (min², lower is better) and success rate:

| policy | low | medium | high |
| --- | --- | --- | --- |
| Swift insertion rule | 3.78 | 9.40 | 13.60 |
| Random from the top 8 | 54.0 | 73.8 | 78.9 |
| Random from every insertion | 1299 (96% complete) | 2727 (22% complete) | no run completes |
| Jev v4, top 8 | 3.99 | 11.89 | 17.40 |
| Gemini v4, top 8 | 3.81 | 10.26 | 15.64 |

Random choice from the shortlist is 6 to 14 times worse than the rule.
Random choice from the full set does not even finish the day at medium
and high load: requests are still unserved at the completion deadline.

Decision diagnosis (`diagnosis/`): random top 8 picks the rule's best
15.5% of the time (one in eight plus ties), mean regret 49.8, and errs
toward long waits for the new passenger (+1.7 minutes on average). Jev
and Gemini in the same condition pick the best 73% and 77% of the time
with regret 1.7 and 0.7.

What this settles: the shortlist by itself is worth nothing. The eight
cheapest insertions still span a wide range of immediate cost, and a
model that gets within a few percent of Swift from that set is choosing
well, not being carried by the host. Whatever a shortlisted model scores
between 54 and 3.8 at low load is its own judgement.
