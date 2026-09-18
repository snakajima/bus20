# synthetic-dev/1, dev split: Swift and Jev native flat (2026-09-18)

27 scenarios, one repetition. Jev: native presentation, flat choice.
Swift wins all 24 completed pairs; Jev fails 3 high-load runs (two on the
64k input-token limit at 223 and 232 candidates, one on the 255-option cap).
Equal-weight pain: low 3.96 vs 6.32, medium 12.25 vs 38.17, high 34.20 vs
193.29 (67% success). Cost $0.40 for 1,379 decisions. This run motivated
the 0.65 high-load target, the softer hotspot, and the tournament mode.
