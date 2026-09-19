# Benchmark analysis: synthetic-dev/2

Manifest sha256:7b0d3cfbdc1e114815c83ae9075718f2c82be582d054000ae6c182ce91f723c8. Reference policy: swift-insertion-reference. Bootstrap seed 1, 95% percentile intervals over scenarios.

## Per cell (policy x city x load)

Pain is reported over complete runs only; read it together with the success rate.

| policy | city | load | runs | success | pain (complete only) | 95% CI | mean cost (USD) | latency p50 (ms) | failures |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| swift-insertion-reference | sf-like | low | 9 | 100% | 3.67 | [3.28, 4.08] | n/a | 0 | - |
| swift-insertion-reference | tokyo-like | low | 9 | 100% | 1.93 | [1.85, 2.01] | n/a | 0 | - |
| swift-insertion-reference | nyc-like | low | 9 | 100% | 5.75 | [4.57, 6.93] | n/a | 0 | - |
| swift-insertion-reference | sf-like | medium | 9 | 100% | 7.33 | [5.99, 8.96] | n/a | 1 | - |
| swift-insertion-reference | tokyo-like | medium | 9 | 100% | 4.94 | [3.95, 5.93] | n/a | 0 | - |
| swift-insertion-reference | nyc-like | medium | 9 | 100% | 15.92 | [12.92, 18.41] | n/a | 1 | - |
| swift-insertion-reference | sf-like | high | 9 | 100% | 12.63 | [9.57, 15.35] | n/a | 1 | - |
| swift-insertion-reference | tokyo-like | high | 9 | 100% | 7.58 | [6.56, 8.58] | n/a | 1 | - |
| swift-insertion-reference | nyc-like | high | 9 | 100% | 20.59 | [17.82, 23.21] | n/a | 1 | - |
| rollout-reference:empirical:k8:s64:h10 | sf-like | low | 9 | 100% | 3.66 | [2.92, 4.48] | n/a | 31 | - |
| rollout-reference:empirical:k8:s64:h10 | tokyo-like | low | 9 | 100% | 2.08 | [1.84, 2.32] | n/a | 17 | - |
| rollout-reference:empirical:k8:s64:h10 | nyc-like | low | 9 | 100% | 5.72 | [4.07, 7.46] | n/a | 48 | - |
| rollout-reference:empirical:k8:s64:h10 | sf-like | medium | 9 | 100% | 7.46 | [5.87, 9.26] | n/a | 113 | - |
| rollout-reference:empirical:k8:s64:h10 | tokyo-like | medium | 9 | 100% | 5.19 | [3.70, 6.79] | n/a | 120 | - |
| rollout-reference:empirical:k8:s64:h10 | nyc-like | medium | 9 | 100% | 14.51 | [10.89, 18.01] | n/a | 183 | - |
| rollout-reference:empirical:k8:s64:h10 | sf-like | high | 9 | 100% | 10.76 | [8.26, 13.32] | n/a | 232 | - |
| rollout-reference:empirical:k8:s64:h10 | tokyo-like | high | 9 | 100% | 7.35 | [5.93, 8.94] | n/a | 241 | - |
| rollout-reference:empirical:k8:s64:h10 | nyc-like | high | 9 | 100% | 21.83 | [18.98, 24.33] | n/a | 270 | - |
| rollout-reference:known:k8:s64:h10 | sf-like | low | 9 | 100% | 3.16 | [2.56, 3.87] | n/a | 30 | - |
| rollout-reference:known:k8:s64:h10 | tokyo-like | low | 9 | 100% | 1.82 | [1.66, 1.96] | n/a | 20 | - |
| rollout-reference:known:k8:s64:h10 | nyc-like | low | 9 | 100% | 4.87 | [4.00, 5.73] | n/a | 28 | - |
| rollout-reference:known:k8:s64:h10 | sf-like | medium | 9 | 100% | 6.47 | [5.14, 8.04] | n/a | 139 | - |
| rollout-reference:known:k8:s64:h10 | tokyo-like | medium | 9 | 100% | 4.78 | [3.71, 5.93] | n/a | 161 | - |
| rollout-reference:known:k8:s64:h10 | nyc-like | medium | 9 | 100% | 13.79 | [10.60, 16.81] | n/a | 111 | - |
| rollout-reference:known:k8:s64:h10 | sf-like | high | 9 | 100% | 9.60 | [7.51, 11.65] | n/a | 277 | - |
| rollout-reference:known:k8:s64:h10 | tokyo-like | high | 9 | 100% | 7.12 | [5.47, 8.75] | n/a | 251 | - |
| rollout-reference:known:k8:s64:h10 | nyc-like | high | 9 | 100% | 17.39 | [15.40, 19.52] | n/a | 176 | - |

## Paired against the reference

Diff is reference pain minus policy pain on the same scenario and repetition; positive favours the policy. Improvement % uses the reference pain as denominator and is omitted when it is 0.

| policy | city | load | pairs | both complete | only ref | only policy | mean diff (ref - policy) | 95% CI | mean improvement % | policy wins |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| rollout-reference:empirical:k8:s64:h10 | sf-like | low | 9 | 9 | 0 | 0 | 0.00 | [-0.39, 0.37] | 2.5 | 6/9 |
| rollout-reference:empirical:k8:s64:h10 | tokyo-like | low | 9 | 9 | 0 | 0 | -0.15 | [-0.32, 0.05] | -7.1 | 2/9 |
| rollout-reference:empirical:k8:s64:h10 | nyc-like | low | 9 | 9 | 0 | 0 | 0.03 | [-0.96, 0.83] | 2.3 | 6/9 |
| rollout-reference:empirical:k8:s64:h10 | sf-like | medium | 9 | 9 | 0 | 0 | -0.14 | [-0.76, 0.42] | -0.8 | 5/9 |
| rollout-reference:empirical:k8:s64:h10 | tokyo-like | medium | 9 | 9 | 0 | 0 | -0.25 | [-0.80, 0.25] | -1.3 | 4/9 |
| rollout-reference:empirical:k8:s64:h10 | nyc-like | medium | 9 | 9 | 0 | 0 | 1.41 | [-0.14, 2.60] | 11.5 | 7/9 |
| rollout-reference:empirical:k8:s64:h10 | sf-like | high | 9 | 9 | 0 | 0 | 1.87 | [0.32, 3.38] | 13.4 | 8/9 |
| rollout-reference:empirical:k8:s64:h10 | tokyo-like | high | 9 | 9 | 0 | 0 | 0.23 | [-0.51, 0.85] | 4.9 | 6/9 |
| rollout-reference:empirical:k8:s64:h10 | nyc-like | high | 9 | 9 | 0 | 0 | -1.24 | [-2.05, -0.57] | -6.1 | 1/9 |
| rollout-reference:known:k8:s64:h10 | sf-like | low | 9 | 9 | 0 | 0 | 0.51 | [0.14, 0.82] | 15.3 | 8/9 |
| rollout-reference:known:k8:s64:h10 | tokyo-like | low | 9 | 9 | 0 | 0 | 0.11 | [-0.06, 0.29] | 5.5 | 6/9 |
| rollout-reference:known:k8:s64:h10 | nyc-like | low | 9 | 9 | 0 | 0 | 0.88 | [0.33, 1.44] | 12.1 | 6/9 |
| rollout-reference:known:k8:s64:h10 | sf-like | medium | 9 | 9 | 0 | 0 | 0.86 | [0.48, 1.23] | 12.4 | 8/9 |
| rollout-reference:known:k8:s64:h10 | tokyo-like | medium | 9 | 9 | 0 | 0 | 0.16 | [-0.12, 0.43] | 4.1 | 6/9 |
| rollout-reference:known:k8:s64:h10 | nyc-like | medium | 9 | 9 | 0 | 0 | 2.13 | [1.41, 2.82] | 15.5 | 9/9 |
| rollout-reference:known:k8:s64:h10 | sf-like | high | 9 | 9 | 0 | 0 | 3.03 | [1.42, 4.68] | 21.4 | 9/9 |
| rollout-reference:known:k8:s64:h10 | tokyo-like | high | 9 | 9 | 0 | 0 | 0.46 | [-0.28, 1.11] | 8.8 | 6/9 |
| rollout-reference:known:k8:s64:h10 | nyc-like | high | 9 | 9 | 0 | 0 | 3.21 | [1.98, 4.47] | 14.7 | 8/9 |

## Across cities (equal weight per city)

Each city contributes equally regardless of its request count.

| policy | load | cities | success (equal-weight) | pain (equal-weight, complete only) |
| --- | --- | --- | --- | --- |
| swift-insertion-reference | low | 3 | 100% | 3.78 |
| swift-insertion-reference | medium | 3 | 100% | 9.40 |
| swift-insertion-reference | high | 3 | 100% | 13.60 |
| rollout-reference:empirical:k8:s64:h10 | low | 3 | 100% | 3.82 |
| rollout-reference:empirical:k8:s64:h10 | medium | 3 | 100% | 9.05 |
| rollout-reference:empirical:k8:s64:h10 | high | 3 | 100% | 13.32 |
| rollout-reference:known:k8:s64:h10 | low | 3 | 100% | 3.28 |
| rollout-reference:known:k8:s64:h10 | medium | 3 | 100% | 8.35 |
| rollout-reference:known:k8:s64:h10 | high | 3 | 100% | 11.37 |
