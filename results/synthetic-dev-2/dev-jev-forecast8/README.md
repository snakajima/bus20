# synthetic-dev/2, dev split: Jev with the rule's top 8 and a demand forecast (2026-09-19)

`--presentation forecast --shortlist 8` (prompt version 5): on top of
version 4, the state says how many new requests to expect in the next ten
minutes, and every option says in how many minutes the vehicle would be
free and how many requests are expected to appear near where it ends up
in the ten minutes after that. The numbers come from the same demand
distribution the known-demand rollout uses (32 sampled days per decision,
seeded by the decision); the day's stored requests are never read. Same
27 dev scenarios, three repetitions, all runs complete. The index also
carries Swift, the rollout, and the version-4 top-8 condition.

Equal-weight pain over cities (min², lower is better):

| load | Swift | Rollout (known) | Jev v4, top 8 | Jev v5 forecast, top 8 |
| --- | --- | --- | --- | --- |
| low | 3.78 | 3.28 | 3.99 | **3.86** |
| medium | 9.40 | 8.35 | 11.89 | **11.44** |
| high | 13.60 | 11.37 | 17.40 | **15.29** |

The forecast helps most where lookahead matters most: -12% at high load,
-4% at medium, -3% at low. Cost $0.34 for 81 runs, 131 ms per decision.

Decision diagnosis (`diagnosis/`): rule's best 77.2% (v4 top 8: 72.6%),
mean regret 1.18 (1.66), p90 2.9 (5.0). With the forecast Jev agrees
with the rule more often, not less: the forecast mostly stops it from
leaving the rule for a bad reason rather than making it plan.

Paired against Swift, Jev wins 18 of 81 (v4 top 8: 16; full set v3: 2),
7 of 9 in sf-like low. The gap to Swift is 2% at low load and 12 to 22%
at medium and high; the gap to the rollout, which uses the same demand
knowledge with real lookahead, is 18 to 37%.
