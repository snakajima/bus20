# synthetic-dev/2, dev split, high load: Swift and Jev (2026-09-18)

Nine high-load dev scenarios (utilisation 0.65, hotspot 40% over 15 minutes).
Jev: native presentation, tournament mode (flat up to 180 candidates, then
chunks of 120 in one batched call plus a final). All 18 runs complete.

| scenario | pattern | Swift | Jev | ratio | max candidates | tournament decisions |
| --- | --- | --- | --- | --- | --- | --- |
| sf-like-high-01 | uniform | 6.3 | 13.0 | 2.0 | 55 | 0 |
| sf-like-high-02 | commute | 16.5 | 14.6 | 0.9 | 98 | 0 |
| sf-like-high-03 | hotspot | 15.0 | 68.0 | 4.5 | 195 | 1 |
| tokyo-like-high-01 | uniform | 5.7 | 17.8 | 3.1 | 80 | 0 |
| tokyo-like-high-02 | commute | 7.6 | 11.9 | 1.6 | 94 | 0 |
| tokyo-like-high-03 | hotspot | 9.4 | 41.4 | 4.4 | 200 | 3 |
| nyc-like-high-01 | uniform | 15.5 | 21.6 | 1.4 | 63 | 0 |
| nyc-like-high-02 | commute | 25.2 | 54.2 | 2.2 | 115 | 0 |
| nyc-like-high-03 | hotspot | 21.1 | 52.9 | 2.5 | 118 | 0 |

Jev cost for the nine runs: $0.16. Single repetition; Jev's run-to-run
variation on the same scenario is large (see `results/synthetic-dev-1/dev-jev-native`).
