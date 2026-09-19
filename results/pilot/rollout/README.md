# Rollout reference pilot (2026-09-19)

Five dev scenarios, one run each, default rollout settings (shortlist 8,
64 samples, 10-minute horizon, seed 0). `insertion-rule` is the rollout
policy with zero samples, which is exactly the Swift insertion rule (same
pain as the Swift CLI on every scenario here). See
`docs/rollout-reference.md` for the method and the discussion.

| scenario | insertion rule | rollout, empirical | rollout, known |
| --- | --- | --- | --- |
| sf-like-low-dev-01 (dev-1) | 3.37 | 3.05 | 2.80 |
| tokyo-like-low-dev-02 (dev-1) | 1.81 | 2.09 | 1.90 |
| nyc-like-medium-dev-01 (dev-1) | 10.22 | 7.14 | 7.51 |
| sf-like-high-dev-01 (dev-2) | 6.34 | 5.63 | 5.63 |
| tokyo-like-high-dev-03 (dev-2) | 9.37 | 10.24 | 9.50 |

Each scenario directory holds the three runs and a `comparison.md`.
