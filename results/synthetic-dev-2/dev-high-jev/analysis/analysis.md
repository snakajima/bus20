# Benchmark analysis: synthetic-dev/2

Manifest sha256:7b0d3cfbdc1e114815c83ae9075718f2c82be582d054000ae6c182ce91f723c8. Reference policy: swift-insertion-reference. Bootstrap seed 1, 95% percentile intervals over scenarios.

## Per cell (policy x city x load)

Pain is reported over complete runs only; read it together with the success rate.

| policy | city | load | runs | success | pain (complete only) | 95% CI | mean cost (USD) | latency p50 (ms) | failures |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| swift-insertion-reference | sf-like | high | 3 | 100% | 12.63 | [6.34, 16.53] | n/a | 1 | - |
| jev:jev-1.13.0:jev-native:tournament:x1 | sf-like | high | 3 | 100% | 31.85 | [12.96, 67.98] | 0.0180 | 157 | - |
| jev:jev-1.13.0:jev-native:tournament:x1 | tokyo-like | high | 3 | 100% | 23.69 | [11.91, 41.42] | 0.0226 | 158 | - |
| swift-insertion-reference | tokyo-like | high | 3 | 100% | 7.58 | [5.73, 9.37] | n/a | 1 | - |
| swift-insertion-reference | nyc-like | high | 3 | 100% | 20.59 | [15.50, 25.21] | n/a | 1 | - |
| jev:jev-1.13.0:jev-native:tournament:x1 | nyc-like | high | 3 | 100% | 42.91 | [21.65, 54.21] | 0.0127 | 144 | - |

## Paired against the reference

Diff is reference pain minus policy pain on the same scenario and repetition; positive favours the policy. Improvement % uses the reference pain as denominator and is omitted when it is 0.

| policy | city | load | pairs | both complete | only ref | only policy | mean diff (ref - policy) | 95% CI | mean improvement % | policy wins |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| jev:jev-1.13.0:jev-native:tournament:x1 | sf-like | high | 3 | 3 | 0 | 0 | -19.22 | [-52.96, 1.92] | -148.5 | 1/3 |
| jev:jev-1.13.0:jev-native:tournament:x1 | tokyo-like | high | 3 | 3 | 0 | 0 | -16.11 | [-32.05, -4.26] | -202.5 | 0/3 |
| jev:jev-1.13.0:jev-native:tournament:x1 | nyc-like | high | 3 | 3 | 0 | 0 | -22.32 | [-31.81, -6.15] | -101.9 | 0/3 |

## Across cities (equal weight per city)

Each city contributes equally regardless of its request count.

| policy | load | cities | success (equal-weight) | pain (equal-weight, complete only) |
| --- | --- | --- | --- | --- |
| swift-insertion-reference | high | 3 | 100% | 13.60 |
| jev:jev-1.13.0:jev-native:tournament:x1 | high | 3 | 100% | 32.82 |
