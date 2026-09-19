# synthetic-dev/2, dev split: Gemini and Jev under the same conditions (2026-09-19)

Gemini 3.8 Flash at low effort with prompt v4 (`cumulative`) and v5
(`forecast`), each choosing among the insertion rule's eight cheapest
insertions (`--shortlist 8`): the conditions Jev was run under in
`dev-jev-top8` and `dev-jev-forecast8`. 27 dev scenarios, three
repetitions, all runs complete. The index carries Swift, the rollout, the
full-set Gemini v3 run, and the four shortlisted conditions.

Equal-weight pain over cities (min², lower is better):

| condition | low | medium | high | cost (81 runs) | latency |
| --- | --- | --- | --- | --- | --- |
| Swift insertion rule | 3.78 | 9.40 | 13.60 | $0 | <1 ms |
| Rollout (known demand) | 3.28 | 8.35 | 11.37 | $0 | 0.1 s |
| Gemini v3, full set | 4.30 | 13.62 | 19.07 | $16.70 | 1.6 s |
| Gemini v4, top 8 | 3.81 | 10.26 | 15.64 | $8.92 | 1.6 s |
| Gemini v5 forecast, top 8 | **3.63** | **10.13** | **15.59** | $8.70 | 1.5 s |
| Jev v4, top 8 | 3.99 | 11.89 | 17.40 | $0.28 | 0.13 s |
| Jev v5 forecast, top 8 | 3.86 | 11.44 | 15.29 | $0.34 | 0.13 s |

Decision diagnosis (`diagnosis/`), all 4,032 decisions per condition:

| condition | rule's best | top 3 | mean regret | p90 |
| --- | --- | --- | --- | --- |
| Gemini v4, top 8 | 77.2% | 97.5% | 0.74 | 2.3 |
| Gemini v5 forecast, top 8 | 84.5% | 98.3% | 0.39 | 1.0 |
| Jev v4, top 8 | 72.6% | 94.4% | 1.66 | 5.0 |
| Jev v5 forecast, top 8 | 77.2% | 95.3% | 1.18 | 2.9 |

- The shortlist does for Gemini what it did for Jev: 19.07 to 15.64 at
  high load, 13.62 to 10.26 at medium, and it halves the cost because
  the prompt is shorter. Gemini v4 top 8 wins 35 of 81 paired scenarios
  against Swift (full set: 15) and beats it at low load in sf-like and
  at medium load in tokyo-like and nyc-like.
- The forecast helps Gemini less than it helped Jev (-5% at low, -1% at
  medium, 0% at high, against Jev's -3 / -4 / -12%), and it moves Gemini
  toward the rule: 84.5% of its choices are the rule's best, the highest
  agreement of any model, with the lowest regret. Gemini reads the
  forecast as a reason to be careful, not as a reason to reposition.
- Under identical information and choice sets, Gemini is ahead of Jev by
  5 to 12% at v4 and by 2 to 6% at v5, at 25 times the cost and 12 times
  the latency. At high load with the forecast the two are within 2%.
- Neither reaches the rollout, which uses the same demand knowledge with
  real lookahead: it stays 10 to 27% ahead of the best shortlisted model.
