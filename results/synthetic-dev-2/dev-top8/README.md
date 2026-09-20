# synthetic-dev/2, dev split: every model under the same conditions (2026-09-19)

All four online models with prompt v4 (`cumulative`) and v5 (`forecast`),
each choosing among the insertion rule's eight cheapest insertions
(`--shortlist 8`), effort low, 27 dev scenarios, three repetitions. The
index also carries Swift, the known-demand rollout, the random-from-top-8
floor, the full-set Claude v3 run, and Laya (top 3, x3). Every run
complete; three Claude v5 high-load runs first failed on Anthropic 529
"overloaded" errors and were rerun after a pause (same seeds, same
scenario), which the protocol allows for transport failures.

Equal-weight pain over cities (min², lower is better):

| condition | low | medium | high | cost (81 runs) | latency | wins vs Swift |
| --- | --- | --- | --- | --- | --- | --- |
| Swift insertion rule | 3.78 | 9.40 | 13.60 | $0 | <1 ms | – |
| Rollout (known demand) | **3.28** | **8.35** | **11.37** | $0 | 0.1 s | 66/81 |
| Claude opus-5, v4 | 3.92 | 10.32 | 14.88 | $48.62 | 2.2 s | 30/81 |
| Claude opus-5, v5 | 3.84 | 10.70 | 15.34 | $60.05 | 2.0 s | 28/81 |
| GPT-5.6 Sol, v4 | 3.79 | 11.56 | 15.39 | $20.80 | 2.4 s | 22/81 |
| GPT-5.6 Sol, v5 | 3.81 | 9.96 | 15.17 | $27.07 | 2.1 s | 27/81 |
| Gemini 3.8 Flash, v4 | 3.81 | 10.26 | 15.64 | $8.92 | 1.6 s | 35/81 |
| Gemini 3.8 Flash, v5 | 3.63 | 10.13 | 15.59 | $8.70 | 1.5 s | 25/81 |
| Jev 1.13.0, v4 | 3.99 | 11.89 | 17.40 | $0.28 | 0.13 s | 16/81 |
| Jev 1.13.0, v5 | 3.86 | 11.44 | 15.29 | $0.34 | 0.13 s | 18/81 |
| Laya, v4, top 3, x3 | 6.31 | 14.52 | 20.43 | $0 | 2.9 s | 0/81 |
| Random from the top 8 | 54.04 | 73.82 | 78.90 | $0 | <1 ms | 0/81 |
| Claude v3, full set (for reference) | 3.77 | 13.27 | 17.99 | $107.03 | 2.3 s | 25/81 |

Decision diagnosis (`diagnosis/`), 4,032 decisions per condition:

| condition | rule's best | top 3 | mean regret | p90 |
| --- | --- | --- | --- | --- |
| Claude v4 / v5 | 78.1% / 81.5% | 97.7% / 97.7% | 0.70 / 0.55 | 2.0 / 1.5 |
| GPT-5.6 Sol v4 / v5 | 77.5% / 83.8% | 97.4% / 97.8% | 0.75 / 0.47 | 2.3 / 1.1 |
| Gemini v4 / v5 | 77.2% / 84.5% | 97.5% / 98.3% | 0.74 / 0.39 | 2.3 / 1.0 |
| Jev v4 / v5 | 72.6% / 77.2% | 94.4% / 95.3% | 1.66 / 1.18 | 5.0 / 2.9 |

What the same conditions show:

- **The three general LLMs are indistinguishable.** Under v4 they sit
  within 0.2 of each other at low load and within 1.3 at medium and high;
  their decision statistics are identical to the first decimal (77 to 78%
  best, regret 0.7). Model choice among frontier LLMs matters far less
  than what the host gives them. Cost differs by 5x (Gemini $9, Claude
  $49) and latency by 1.5x for the same result.
- **The shortlist is the biggest lever for every model.** Claude went
  from 3.77 / 13.27 / 17.99 on the full set to 3.92 / 10.32 / 14.88 at
  less than half the cost; the LLMs now trail Swift by 2 to 10% at low
  load and 10 to 23% at medium and high, against 30 to 40% before.
- **The forecast (v5) raises agreement with the rule for every model**
  (best 77-78% to 82-85%, regret roughly halved) but moves pain little and
  not always down (Claude +4% at medium). The models read the forecast as
  a reason to be careful, not as a reason to reposition a vehicle; none
  of them turns it into the 11 to 16% gain the rollout gets from the same
  demand knowledge with real lookahead.
- **Jev is the cheap end of the same frontier.** With v5 it is within 1
  to 8% of the LLMs at every load, at 1/25 to 1/175 of the cost and 1/15
  of the latency. Its remaining gap is in the tail (p90 regret 2.9 vs 1.0
  to 1.5), not in the typical decision.
- **Nobody beats Swift on average, and nobody reaches the rollout.** The
  best model conditions win 25 to 35 of 81 paired scenarios against
  Swift; the rollout wins 66. Given the same eight options, models pick
  the rule's best three quarters of the time and pay a small price when
  they deviate; the rollout deviates about as often and gains, because it
  simulates what the deviation buys.

Per-cell paired tables with bootstrap intervals in `analysis/analysis.md`.
