# synthetic-dev/2, dev split: Swift vs the rollout reference (2026-09-19)

27 dev scenarios, three repetitions. The rollout reference runs with its
defaults (shortlist 8, 64 sampled futures, 10-minute horizon); repetition
`r` uses seed `r`, so repetitions sample different futures. Swift is
deterministic, so its three repetitions are identical. All 243 runs
complete and replay. As with the other suite results, only the suite
index and the analysis are committed; the run logs stay in `out/`.

Equal-weight pain over cities (min², lower is better):

| load | Swift | rollout, empirical demand | rollout, known demand |
| --- | --- | --- | --- |
| low | 3.78 | 3.82 | **3.28** (-13%) |
| medium | 9.40 | 9.05 | **8.35** (-11%) |
| high | 13.60 | 13.32 | **11.37** (-16%) |

Paired against Swift per (city, load) cell, 9 pairs each: the known-demand
rollout wins 6 to 9 of 9 pairs in every cell, with 95% bootstrap intervals
of the mean improvement excluding zero in six of nine cells. The empirical
rollout is neutral overall (wins in sf-like high and nyc-like medium, loses
in nyc-like high). See `analysis/analysis.md` for the full tables.

Wall time: median decision latency about 0.1 s for the rollout, up to
1.8 s at p95 on the hardest high-load scenarios, against under 1 ms for
Swift. Latency never enters virtual time.
