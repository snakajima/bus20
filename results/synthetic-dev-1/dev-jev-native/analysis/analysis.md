# Benchmark analysis: synthetic-dev/1

Manifest sha256:58fdffbe7e405dfdde4b9d3dbb476806ecc213d0d8f96efc391046a6c282c994. Reference policy: swift-insertion-reference. Bootstrap seed 1, 95% percentile intervals over scenarios.

## Per cell (policy x city x load)

Pain is reported over complete runs only; read it together with the success rate.

| policy | city | load | runs | success | pain (complete only) | 95% CI | mean cost (USD) | latency p50 (ms) | failures |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| swift-insertion-reference | sf-like | low | 3 | 100% | 4.04 | [3.37, 4.53] | n/a | 0 | - |
| jev:jev-1.13.0:jev-native:flat:x1 | sf-like | low | 3 | 100% | 6.56 | [3.55, 11.05] | 0.0027 | 129 | - |
| jev:jev-1.13.0:jev-native:flat:x1 | sf-like | medium | 3 | 100% | 36.96 | [5.39, 97.02] | 0.0127 | 137 | - |
| swift-insertion-reference | sf-like | medium | 3 | 100% | 9.98 | [5.10, 18.39] | n/a | 1 | - |
| swift-insertion-reference | sf-like | high | 3 | 100% | 33.80 | [8.84, 71.13] | n/a | 2 | - |
| jev:jev-1.13.0:jev-native:flat:x1 | sf-like | high | 3 | 67% | 156.38 | [16.90, 295.87] | 0.0346 | 175 | policyError:1 |
| jev:jev-1.13.0:jev-native:flat:x1 | tokyo-like | low | 3 | 100% | 3.81 | [2.74, 5.81] | 0.0025 | 137 | - |
| swift-insertion-reference | tokyo-like | low | 3 | 100% | 2.14 | [1.81, 2.52] | n/a | 0 | - |
| swift-insertion-reference | tokyo-like | medium | 3 | 100% | 7.29 | [3.23, 14.08] | n/a | 0 | - |
| jev:jev-1.13.0:jev-native:flat:x1 | tokyo-like | medium | 3 | 100% | 15.39 | [4.60, 35.68] | 0.0112 | 144 | - |
| jev:jev-1.13.0:jev-native:flat:x1 | tokyo-like | high | 3 | 33% | 19.60 | n/a | 0.0250 | 165 | policyError:2 |
| swift-insertion-reference | tokyo-like | high | 3 | 100% | 25.58 | [7.57, 58.63] | n/a | 2 | - |
| swift-insertion-reference | nyc-like | low | 3 | 100% | 5.71 | [3.22, 7.63] | n/a | 0 | - |
| jev:jev-1.13.0:jev-native:flat:x1 | nyc-like | low | 3 | 100% | 8.60 | [4.61, 11.63] | 0.0019 | 123 | - |
| jev:jev-1.13.0:jev-native:flat:x1 | nyc-like | medium | 3 | 100% | 62.16 | [12.66, 123.39] | 0.0094 | 144 | - |
| swift-insertion-reference | nyc-like | medium | 3 | 100% | 19.48 | [10.22, 28.11] | n/a | 1 | - |
| swift-insertion-reference | nyc-like | high | 3 | 100% | 43.23 | [18.35, 67.80] | n/a | 2 | - |
| jev:jev-1.13.0:jev-native:flat:x1 | nyc-like | high | 3 | 100% | 403.89 | [27.91, 721.34] | 0.0315 | 182 | - |

## Paired against the reference

Diff is reference pain minus policy pain on the same scenario and repetition; positive favours the policy. Improvement % uses the reference pain as denominator and is omitted when it is 0.

| policy | city | load | pairs | both complete | only ref | only policy | mean diff (ref - policy) | 95% CI | mean improvement % | policy wins |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| jev:jev-1.13.0:jev-native:flat:x1 | sf-like | low | 3 | 3 | 0 | 0 | -2.52 | [-6.52, -0.18] | -56.7 | 0/3 |
| jev:jev-1.13.0:jev-native:flat:x1 | sf-like | medium | 3 | 3 | 0 | 0 | -26.99 | [-78.63, -0.29] | -155.0 | 0/3 |
| jev:jev-1.13.0:jev-native:flat:x1 | sf-like | high | 3 | 2 | 1 | 0 | -141.25 | [-274.44, -8.06] | -685.9 | 0/2 |
| jev:jev-1.13.0:jev-native:flat:x1 | tokyo-like | low | 3 | 3 | 0 | 0 | -1.67 | [-3.29, -0.64] | -73.5 | 0/3 |
| jev:jev-1.13.0:jev-native:flat:x1 | tokyo-like | medium | 3 | 3 | 0 | 0 | -8.10 | [-21.59, -1.33] | -74.9 | 0/3 |
| jev:jev-1.13.0:jev-native:flat:x1 | tokyo-like | high | 3 | 1 | 2 | 0 | -12.04 | n/a | -159.1 | 0/1 |
| jev:jev-1.13.0:jev-native:flat:x1 | nyc-like | low | 3 | 3 | 0 | 0 | -2.89 | [-4.00, -1.38] | -49.3 | 0/3 |
| jev:jev-1.13.0:jev-native:flat:x1 | nyc-like | medium | 3 | 3 | 0 | 0 | -42.69 | [-95.28, -2.44] | -171.3 | 0/3 |
| jev:jev-1.13.0:jev-native:flat:x1 | nyc-like | high | 3 | 3 | 0 | 0 | -360.66 | [-677.80, -9.55] | -730.2 | 0/3 |

## Across cities (equal weight per city)

Each city contributes equally regardless of its request count.

| policy | load | cities | success (equal-weight) | pain (equal-weight, complete only) |
| --- | --- | --- | --- | --- |
| swift-insertion-reference | low | 3 | 100% | 3.96 |
| jev:jev-1.13.0:jev-native:flat:x1 | low | 3 | 100% | 6.32 |
| jev:jev-1.13.0:jev-native:flat:x1 | medium | 3 | 100% | 38.17 |
| swift-insertion-reference | medium | 3 | 100% | 12.25 |
| swift-insertion-reference | high | 3 | 100% | 34.20 |
| jev:jev-1.13.0:jev-native:flat:x1 | high | 3 | 67% | 193.29 |
