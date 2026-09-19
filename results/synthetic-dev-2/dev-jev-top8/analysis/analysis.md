# Benchmark analysis: synthetic-dev/2

Manifest sha256:7b0d3cfbdc1e114815c83ae9075718f2c82be582d054000ae6c182ce91f723c8. Reference policy: swift-insertion-reference. Bootstrap seed 1, 95% percentile intervals over scenarios.

## Per cell (policy x city x load)

Pain is reported over complete runs only; read it together with the success rate.

| policy | city | load | runs | success | pain (complete only) | 95% CI | mean cost (USD) | latency p50 (ms) | failures |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| swift-insertion-reference | sf-like | low | 9 | 100% | 3.67 | [3.28, 4.08] | n/a | 0 | - |
| claude:claude-opus-5:low:consequences:flat | sf-like | low | 9 | 100% | 3.87 | [3.28, 4.59] | 0.3947 | 2129 | - |
| claude:claude-opus-5:low:consequences:flat | tokyo-like | low | 9 | 100% | 2.11 | [1.90, 2.30] | 0.3662 | 2078 | - |
| swift-insertion-reference | tokyo-like | low | 9 | 100% | 1.93 | [1.86, 2.01] | n/a | 0 | - |
| swift-insertion-reference | nyc-like | low | 9 | 100% | 5.75 | [4.40, 6.93] | n/a | 0 | - |
| claude:claude-opus-5:low:consequences:flat | nyc-like | low | 9 | 100% | 5.35 | [4.71, 5.93] | 0.2819 | 2083 | - |
| swift-insertion-reference | sf-like | medium | 9 | 100% | 7.33 | [5.99, 8.96] | n/a | 1 | - |
| claude:claude-opus-5:low:consequences:flat | sf-like | medium | 9 | 100% | 9.66 | [6.92, 12.73] | 1.3401 | 2467 | - |
| claude:claude-opus-5:low:consequences:flat | tokyo-like | medium | 9 | 100% | 7.59 | [5.06, 10.64] | 1.4458 | 2279 | - |
| swift-insertion-reference | tokyo-like | medium | 9 | 100% | 4.94 | [3.95, 6.06] | n/a | 0 | - |
| swift-insertion-reference | nyc-like | medium | 9 | 100% | 15.92 | [12.92, 18.62] | n/a | 1 | - |
| claude:claude-opus-5:low:consequences:flat | nyc-like | medium | 9 | 100% | 22.55 | [13.16, 31.78] | 1.1211 | 2553 | - |
| swift-insertion-reference | sf-like | high | 9 | 100% | 12.63 | [9.57, 15.23] | n/a | 1 | - |
| claude:claude-opus-5:low:consequences:flat | sf-like | high | 9 | 100% | 14.29 | [10.01, 19.84] | 2.3237 | 2667 | - |
| claude:claude-opus-5:low:consequences:flat | tokyo-like | high | 9 | 100% | 12.57 | [9.49, 16.12] | 2.7893 | 2587 | - |
| swift-insertion-reference | tokyo-like | high | 9 | 100% | 7.58 | [6.58, 8.58] | n/a | 1 | - |
| swift-insertion-reference | nyc-like | high | 9 | 100% | 20.59 | [17.82, 23.21] | n/a | 1 | - |
| claude:claude-opus-5:low:consequences:flat | nyc-like | high | 9 | 100% | 27.11 | [20.54, 33.52] | 1.8293 | 2818 | - |
| jev:jev-1.13.0:consequences:tournament:x1 | sf-like | low | 9 | 100% | 6.74 | [4.39, 9.36] | 0.0024 | 130 | - |
| jev:jev-1.13.0:consequences:tournament:x1 | tokyo-like | low | 9 | 100% | 2.64 | [2.25, 2.97] | 0.0022 | 127 | - |
| jev:jev-1.13.0:consequences:tournament:x1 | nyc-like | low | 9 | 100% | 7.64 | [6.03, 8.96] | 0.0018 | 121 | - |
| jev:jev-1.13.0:consequences:tournament:x1 | sf-like | medium | 9 | 100% | 16.17 | [8.99, 25.66] | 0.0084 | 137 | - |
| jev:jev-1.13.0:consequences:tournament:x1 | tokyo-like | medium | 9 | 100% | 20.35 | [5.29, 38.38] | 0.0105 | 135 | - |
| jev:jev-1.13.0:consequences:tournament:x1 | nyc-like | medium | 9 | 100% | 26.19 | [18.40, 33.45] | 0.0072 | 141 | - |
| jev:jev-1.13.0:consequences:tournament:x1 | sf-like | high | 9 | 100% | 34.91 | [18.88, 52.20] | 0.0180 | 147 | - |
| jev:jev-1.13.0:consequences:tournament:x1 | tokyo-like | high | 9 | 100% | 27.14 | [14.34, 40.92] | 0.0227 | 150 | - |
| jev:jev-1.13.0:consequences:tournament:x1 | nyc-like | high | 9 | 100% | 47.15 | [33.32, 63.41] | 0.0126 | 139 | - |
| jev:jev-1.13.0:cumulative:tournament:x1 | sf-like | low | 9 | 100% | 4.79 | [3.37, 6.35] | 0.0027 | 132 | - |
| jev:jev-1.13.0:cumulative:tournament:x1 | tokyo-like | low | 9 | 100% | 2.78 | [2.59, 2.97] | 0.0026 | 133 | - |
| jev:jev-1.13.0:cumulative:tournament:x1 | nyc-like | low | 9 | 100% | 5.60 | [4.72, 6.61] | 0.0020 | 136 | - |
| jev:jev-1.13.0:cumulative:tournament:x1 | sf-like | medium | 9 | 100% | 16.41 | [9.96, 23.29] | 0.0121 | 146 | - |
| jev:jev-1.13.0:cumulative:tournament:x1 | tokyo-like | medium | 9 | 100% | 10.52 | [5.54, 16.99] | 0.0121 | 144 | - |
| jev:jev-1.13.0:cumulative:tournament:x1 | nyc-like | medium | 9 | 100% | 24.83 | [15.28, 33.93] | 0.0095 | 137 | - |
| jev:jev-1.13.0:cumulative:tournament:x1 | sf-like | high | 9 | 100% | 23.53 | [15.76, 30.96] | 0.0226 | 164 | - |
| jev:jev-1.13.0:cumulative:tournament:x1 | tokyo-like | high | 9 | 100% | 22.80 | [16.17, 29.86] | 0.0301 | 160 | - |
| jev:jev-1.13.0:cumulative:tournament:x1 | nyc-like | high | 9 | 100% | 65.00 | [42.80, 89.74] | 0.0192 | 159 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | sf-like | low | 9 | 100% | 3.90 | [3.13, 4.75] | 0.0018 | 133 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | tokyo-like | low | 9 | 100% | 2.41 | [2.30, 2.53] | 0.0019 | 135 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | nyc-like | low | 9 | 100% | 5.66 | [4.78, 6.62] | 0.0014 | 124 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | sf-like | medium | 9 | 100% | 9.42 | [7.22, 11.93] | 0.0038 | 132 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | tokyo-like | medium | 9 | 100% | 7.35 | [4.60, 10.48] | 0.0043 | 132 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | nyc-like | medium | 9 | 100% | 18.89 | [13.69, 24.53] | 0.0029 | 127 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | sf-like | high | 9 | 100% | 14.83 | [11.74, 17.73] | 0.0051 | 131 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | tokyo-like | high | 9 | 100% | 9.48 | [7.95, 11.04] | 0.0057 | 131 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | nyc-like | high | 9 | 100% | 27.90 | [23.92, 31.77] | 0.0039 | 131 | - |

## Paired against the reference

Diff is reference pain minus policy pain on the same scenario and repetition; positive favours the policy. Improvement % uses the reference pain as denominator and is omitted when it is 0.

| policy | city | load | pairs | both complete | only ref | only policy | mean diff (ref - policy) | 95% CI | mean improvement % | policy wins |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| claude:claude-opus-5:low:consequences:flat | sf-like | low | 9 | 9 | 0 | 0 | -0.20 | [-0.51, 0.08] | -3.9 | 4/9 |
| claude:claude-opus-5:low:consequences:flat | tokyo-like | low | 9 | 9 | 0 | 0 | -0.17 | [-0.34, 0.02] | -9.0 | 3/9 |
| claude:claude-opus-5:low:consequences:flat | nyc-like | low | 9 | 9 | 0 | 0 | 0.41 | [-0.34, 1.15] | 0.3 | 6/9 |
| claude:claude-opus-5:low:consequences:flat | sf-like | medium | 9 | 9 | 0 | 0 | -2.33 | [-3.97, -0.91] | -26.9 | 1/9 |
| claude:claude-opus-5:low:consequences:flat | tokyo-like | medium | 9 | 9 | 0 | 0 | -2.65 | [-4.71, -0.87] | -43.0 | 1/9 |
| claude:claude-opus-5:low:consequences:flat | nyc-like | medium | 9 | 9 | 0 | 0 | -6.64 | [-13.95, 0.15] | -28.3 | 4/9 |
| claude:claude-opus-5:low:consequences:flat | sf-like | high | 9 | 9 | 0 | 0 | -1.66 | [-6.55, 1.96] | -16.7 | 3/9 |
| claude:claude-opus-5:low:consequences:flat | tokyo-like | high | 9 | 9 | 0 | 0 | -4.99 | [-7.81, -2.72] | -59.9 | 0/9 |
| claude:claude-opus-5:low:consequences:flat | nyc-like | high | 9 | 9 | 0 | 0 | -6.52 | [-11.54, -1.89] | -28.5 | 3/9 |
| jev:jev-1.13.0:consequences:tournament:x1 | sf-like | low | 9 | 9 | 0 | 0 | -3.07 | [-5.25, -1.17] | -73.4 | 0/9 |
| jev:jev-1.13.0:consequences:tournament:x1 | tokyo-like | low | 9 | 9 | 0 | 0 | -0.71 | [-1.02, -0.34] | -36.7 | 1/9 |
| jev:jev-1.13.0:consequences:tournament:x1 | nyc-like | low | 9 | 9 | 0 | 0 | -1.89 | [-2.60, -1.28] | -35.1 | 0/9 |
| jev:jev-1.13.0:consequences:tournament:x1 | sf-like | medium | 9 | 9 | 0 | 0 | -8.84 | [-17.38, -2.99] | -97.3 | 0/9 |
| jev:jev-1.13.0:consequences:tournament:x1 | tokyo-like | medium | 9 | 9 | 0 | 0 | -15.41 | [-32.71, -1.47] | -228.3 | 1/9 |
| jev:jev-1.13.0:consequences:tournament:x1 | nyc-like | medium | 9 | 9 | 0 | 0 | -10.27 | [-15.00, -5.43] | -55.4 | 0/9 |
| jev:jev-1.13.0:consequences:tournament:x1 | sf-like | high | 9 | 9 | 0 | 0 | -22.29 | [-38.44, -7.67] | -163.2 | 0/9 |
| jev:jev-1.13.0:consequences:tournament:x1 | tokyo-like | high | 9 | 9 | 0 | 0 | -19.56 | [-32.62, -7.50] | -227.2 | 0/9 |
| jev:jev-1.13.0:consequences:tournament:x1 | nyc-like | high | 9 | 9 | 0 | 0 | -26.56 | [-42.57, -13.38] | -128.6 | 0/9 |
| jev:jev-1.13.0:cumulative:tournament:x1 | sf-like | low | 9 | 9 | 0 | 0 | -1.12 | [-2.27, -0.10] | -24.3 | 2/9 |
| jev:jev-1.13.0:cumulative:tournament:x1 | tokyo-like | low | 9 | 9 | 0 | 0 | -0.85 | [-1.05, -0.68] | -44.1 | 0/9 |
| jev:jev-1.13.0:cumulative:tournament:x1 | nyc-like | low | 9 | 9 | 0 | 0 | 0.15 | [-0.82, 1.38] | -4.6 | 3/9 |
| jev:jev-1.13.0:cumulative:tournament:x1 | sf-like | medium | 9 | 9 | 0 | 0 | -9.08 | [-14.59, -4.09] | -102.7 | 0/9 |
| jev:jev-1.13.0:cumulative:tournament:x1 | tokyo-like | medium | 9 | 9 | 0 | 0 | -5.58 | [-11.27, -1.50] | -84.7 | 0/9 |
| jev:jev-1.13.0:cumulative:tournament:x1 | nyc-like | medium | 9 | 9 | 0 | 0 | -8.91 | [-15.59, -2.26] | -42.6 | 3/9 |
| jev:jev-1.13.0:cumulative:tournament:x1 | sf-like | high | 9 | 9 | 0 | 0 | -10.90 | [-15.98, -6.08] | -79.4 | 0/9 |
| jev:jev-1.13.0:cumulative:tournament:x1 | tokyo-like | high | 9 | 9 | 0 | 0 | -15.22 | [-21.46, -9.50] | -186.6 | 0/9 |
| jev:jev-1.13.0:cumulative:tournament:x1 | nyc-like | high | 9 | 9 | 0 | 0 | -44.40 | [-68.46, -24.02] | -202.6 | 0/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | sf-like | low | 9 | 9 | 0 | 0 | -0.23 | [-0.68, 0.16] | -4.1 | 4/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | tokyo-like | low | 9 | 9 | 0 | 0 | -0.48 | [-0.56, -0.40] | -24.9 | 0/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | nyc-like | low | 9 | 9 | 0 | 0 | 0.09 | [-1.08, 1.31] | -6.4 | 3/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | sf-like | medium | 9 | 9 | 0 | 0 | -2.09 | [-3.45, -0.97] | -27.1 | 0/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | tokyo-like | medium | 9 | 9 | 0 | 0 | -2.41 | [-4.51, -0.62] | -36.1 | 3/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | nyc-like | medium | 9 | 9 | 0 | 0 | -2.97 | [-6.35, -0.01] | -12.4 | 4/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | sf-like | high | 9 | 9 | 0 | 0 | -2.20 | [-3.89, -0.20] | -23.2 | 2/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | tokyo-like | high | 9 | 9 | 0 | 0 | -1.90 | [-2.57, -1.28] | -24.2 | 0/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | nyc-like | high | 9 | 9 | 0 | 0 | -7.31 | [-9.73, -5.17] | -35.8 | 0/9 |

## Across cities (equal weight per city)

Each city contributes equally regardless of its request count.

| policy | load | cities | success (equal-weight) | pain (equal-weight, complete only) |
| --- | --- | --- | --- | --- |
| swift-insertion-reference | low | 3 | 100% | 3.78 |
| claude:claude-opus-5:low:consequences:flat | low | 3 | 100% | 3.77 |
| swift-insertion-reference | medium | 3 | 100% | 9.40 |
| claude:claude-opus-5:low:consequences:flat | medium | 3 | 100% | 13.27 |
| swift-insertion-reference | high | 3 | 100% | 13.60 |
| claude:claude-opus-5:low:consequences:flat | high | 3 | 100% | 17.99 |
| jev:jev-1.13.0:consequences:tournament:x1 | low | 3 | 100% | 5.67 |
| jev:jev-1.13.0:consequences:tournament:x1 | medium | 3 | 100% | 20.90 |
| jev:jev-1.13.0:consequences:tournament:x1 | high | 3 | 100% | 36.40 |
| jev:jev-1.13.0:cumulative:tournament:x1 | low | 3 | 100% | 4.39 |
| jev:jev-1.13.0:cumulative:tournament:x1 | medium | 3 | 100% | 17.25 |
| jev:jev-1.13.0:cumulative:tournament:x1 | high | 3 | 100% | 37.11 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | low | 3 | 100% | 3.99 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | medium | 3 | 100% | 11.89 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | high | 3 | 100% | 17.40 |
