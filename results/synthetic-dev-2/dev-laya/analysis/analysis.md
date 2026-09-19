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
| random-reference:top3 | sf-like | low | 9 | 100% | 8.25 | [6.82, 9.76] | n/a | 0 | - |
| random-reference:top3 | sf-like | medium | 9 | 100% | 15.13 | [12.60, 18.02] | n/a | 0 | - |
| random-reference:top3 | sf-like | high | 9 | 100% | 22.04 | [17.79, 25.87] | n/a | 0 | - |
| random-reference:top3 | tokyo-like | low | 9 | 100% | 4.29 | [3.71, 4.87] | n/a | 0 | - |
| random-reference:top3 | tokyo-like | medium | 9 | 100% | 11.62 | [9.18, 14.32] | n/a | 0 | - |
| random-reference:top3 | tokyo-like | high | 9 | 100% | 14.40 | [11.49, 17.48] | n/a | 0 | - |
| random-reference:top3 | nyc-like | low | 9 | 100% | 14.56 | [12.18, 16.94] | n/a | 0 | - |
| random-reference:top3 | nyc-like | medium | 9 | 100% | 33.55 | [27.33, 40.79] | n/a | 0 | - |
| random-reference:top3 | nyc-like | high | 9 | 100% | 40.70 | [34.37, 47.77] | n/a | 0 | - |
| random-reference:top8 | sf-like | low | 9 | 100% | 54.12 | [39.65, 67.25] | n/a | 0 | - |
| random-reference:top8 | sf-like | medium | 9 | 100% | 55.61 | [46.44, 65.10] | n/a | 0 | - |
| random-reference:top8 | sf-like | high | 9 | 100% | 66.47 | [56.18, 77.67] | n/a | 0 | - |
| random-reference:top8 | tokyo-like | low | 9 | 100% | 27.88 | [20.45, 34.89] | n/a | 0 | - |
| random-reference:top8 | tokyo-like | medium | 9 | 100% | 50.94 | [38.14, 66.40] | n/a | 0 | - |
| random-reference:top8 | tokyo-like | high | 9 | 100% | 38.98 | [29.71, 50.97] | n/a | 0 | - |
| random-reference:top8 | nyc-like | low | 9 | 100% | 80.11 | [61.09, 105.40] | n/a | 0 | - |
| random-reference:top8 | nyc-like | medium | 9 | 100% | 114.92 | [105.65, 125.14] | n/a | 0 | - |
| random-reference:top8 | nyc-like | high | 9 | 100% | 131.26 | [105.74, 160.41] | n/a | 0 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | sf-like | low | 9 | 100% | 3.90 | [3.13, 4.75] | 0.0018 | 133 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | tokyo-like | low | 9 | 100% | 2.41 | [2.30, 2.53] | 0.0019 | 135 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | nyc-like | low | 9 | 100% | 5.66 | [4.78, 6.62] | 0.0014 | 124 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | sf-like | medium | 9 | 100% | 9.42 | [7.22, 11.93] | 0.0038 | 132 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | tokyo-like | medium | 9 | 100% | 7.35 | [4.60, 10.48] | 0.0043 | 132 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | nyc-like | medium | 9 | 100% | 18.89 | [13.69, 24.53] | 0.0029 | 127 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | sf-like | high | 9 | 100% | 14.83 | [11.74, 17.73] | 0.0051 | 131 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | tokyo-like | high | 9 | 100% | 9.48 | [7.95, 11.04] | 0.0057 | 131 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | nyc-like | high | 9 | 100% | 27.90 | [23.92, 31.77] | 0.0039 | 131 | - |
| laya:cumulative:auto:top3:x3 | sf-like | low | 9 | 100% | 5.79 | [4.51, 7.07] | n/a | 4736 | - |
| laya:cumulative:auto:top3:x3 | tokyo-like | low | 9 | 100% | 3.62 | [2.93, 4.38] | n/a | 3008 | - |
| laya:cumulative:auto:top3:x3 | nyc-like | low | 9 | 100% | 9.53 | [8.75, 10.31] | n/a | 2929 | - |
| laya:cumulative:auto:top3:x3 | sf-like | medium | 9 | 100% | 12.47 | [10.10, 15.29] | n/a | 3787 | - |
| laya:cumulative:auto:top3:x3 | tokyo-like | medium | 9 | 100% | 9.58 | [7.78, 11.68] | n/a | 2221 | - |
| laya:cumulative:auto:top3:x3 | nyc-like | medium | 9 | 100% | 21.51 | [15.94, 26.91] | n/a | 1911 | - |
| laya:cumulative:auto:top3:x3 | sf-like | high | 9 | 100% | 16.08 | [14.91, 17.11] | n/a | 3545 | - |
| laya:cumulative:auto:top3:x3 | tokyo-like | high | 9 | 100% | 13.10 | [11.12, 15.08] | n/a | 1889 | - |
| laya:cumulative:auto:top3:x3 | nyc-like | high | 9 | 100% | 32.10 | [28.77, 35.44] | n/a | 1720 | - |

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
| random-reference:top3 | sf-like | low | 9 | 9 | 0 | 0 | -4.58 | [-5.78, -3.38] | -123.6 | 0/9 |
| random-reference:top3 | sf-like | medium | 9 | 9 | 0 | 0 | -7.80 | [-9.58, -6.26] | -110.8 | 0/9 |
| random-reference:top3 | sf-like | high | 9 | 9 | 0 | 0 | -9.41 | [-11.28, -7.44] | -84.5 | 0/9 |
| random-reference:top3 | tokyo-like | low | 9 | 9 | 0 | 0 | -2.36 | [-2.99, -1.74] | -124.5 | 0/9 |
| random-reference:top3 | tokyo-like | medium | 9 | 9 | 0 | 0 | -6.68 | [-8.41, -5.15] | -135.3 | 0/9 |
| random-reference:top3 | tokyo-like | high | 9 | 9 | 0 | 0 | -6.82 | [-9.20, -4.74] | -86.6 | 0/9 |
| random-reference:top3 | nyc-like | low | 9 | 9 | 0 | 0 | -8.80 | [-10.65, -7.00] | -171.0 | 0/9 |
| random-reference:top3 | nyc-like | medium | 9 | 9 | 0 | 0 | -17.63 | [-23.35, -12.68] | -116.0 | 0/9 |
| random-reference:top3 | nyc-like | high | 9 | 9 | 0 | 0 | -20.11 | [-25.67, -15.39] | -97.6 | 0/9 |
| random-reference:top8 | sf-like | low | 9 | 9 | 0 | 0 | -50.46 | [-63.59, -36.22] | -1385.4 | 0/9 |
| random-reference:top8 | sf-like | medium | 9 | 9 | 0 | 0 | -48.28 | [-57.44, -40.00] | -703.6 | 0/9 |
| random-reference:top8 | sf-like | high | 9 | 9 | 0 | 0 | -53.84 | [-65.12, -43.33] | -522.3 | 0/9 |
| random-reference:top8 | tokyo-like | low | 9 | 9 | 0 | 0 | -25.94 | [-32.99, -18.54] | -1347.3 | 0/9 |
| random-reference:top8 | tokyo-like | medium | 9 | 9 | 0 | 0 | -46.00 | [-61.10, -33.49] | -998.7 | 0/9 |
| random-reference:top8 | tokyo-like | high | 9 | 9 | 0 | 0 | -31.40 | [-42.65, -22.90] | -405.7 | 0/9 |
| random-reference:top8 | nyc-like | low | 9 | 9 | 0 | 0 | -74.36 | [-99.64, -55.03] | -1463.9 | 0/9 |
| random-reference:top8 | nyc-like | medium | 9 | 9 | 0 | 0 | -99.00 | [-108.57, -89.80] | -673.7 | 0/9 |
| random-reference:top8 | nyc-like | high | 9 | 9 | 0 | 0 | -110.67 | [-139.76, -86.39] | -541.3 | 0/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | sf-like | low | 9 | 9 | 0 | 0 | -0.23 | [-0.68, 0.16] | -4.1 | 4/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | tokyo-like | low | 9 | 9 | 0 | 0 | -0.48 | [-0.56, -0.40] | -24.9 | 0/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | nyc-like | low | 9 | 9 | 0 | 0 | 0.09 | [-1.08, 1.31] | -6.4 | 3/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | sf-like | medium | 9 | 9 | 0 | 0 | -2.09 | [-3.45, -0.97] | -27.1 | 0/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | tokyo-like | medium | 9 | 9 | 0 | 0 | -2.41 | [-4.51, -0.62] | -36.1 | 3/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | nyc-like | medium | 9 | 9 | 0 | 0 | -2.97 | [-6.35, -0.01] | -12.4 | 4/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | sf-like | high | 9 | 9 | 0 | 0 | -2.20 | [-3.89, -0.20] | -23.2 | 2/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | tokyo-like | high | 9 | 9 | 0 | 0 | -1.90 | [-2.57, -1.28] | -24.2 | 0/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | nyc-like | high | 9 | 9 | 0 | 0 | -7.31 | [-9.73, -5.17] | -35.8 | 0/9 |
| laya:cumulative:auto:top3:x3 | sf-like | low | 9 | 9 | 0 | 0 | -2.12 | [-3.02, -1.18] | -56.0 | 0/9 |
| laya:cumulative:auto:top3:x3 | tokyo-like | low | 9 | 9 | 0 | 0 | -1.69 | [-2.50, -0.96] | -89.6 | 0/9 |
| laya:cumulative:auto:top3:x3 | nyc-like | low | 9 | 9 | 0 | 0 | -3.78 | [-4.53, -2.78] | -83.2 | 0/9 |
| laya:cumulative:auto:top3:x3 | sf-like | medium | 9 | 9 | 0 | 0 | -5.14 | [-6.33, -4.16] | -70.1 | 0/9 |
| laya:cumulative:auto:top3:x3 | tokyo-like | medium | 9 | 9 | 0 | 0 | -4.64 | [-5.76, -3.89] | -94.6 | 0/9 |
| laya:cumulative:auto:top3:x3 | nyc-like | medium | 9 | 9 | 0 | 0 | -5.59 | [-8.17, -3.02] | -30.8 | 0/9 |
| laya:cumulative:auto:top3:x3 | sf-like | high | 9 | 9 | 0 | 0 | -3.46 | [-5.35, -2.05] | -45.0 | 0/9 |
| laya:cumulative:auto:top3:x3 | tokyo-like | high | 9 | 9 | 0 | 0 | -5.52 | [-6.50, -4.54] | -71.8 | 0/9 |
| laya:cumulative:auto:top3:x3 | nyc-like | high | 9 | 9 | 0 | 0 | -11.51 | [-14.04, -9.64] | -57.8 | 0/9 |

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
| random-reference:top3 | low | 3 | 100% | 9.03 |
| random-reference:top3 | medium | 3 | 100% | 20.10 |
| random-reference:top3 | high | 3 | 100% | 25.71 |
| random-reference:top8 | low | 3 | 100% | 54.04 |
| random-reference:top8 | medium | 3 | 100% | 73.82 |
| random-reference:top8 | high | 3 | 100% | 78.90 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | low | 3 | 100% | 3.99 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | medium | 3 | 100% | 11.89 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | high | 3 | 100% | 17.40 |
| laya:cumulative:auto:top3:x3 | low | 3 | 100% | 6.31 |
| laya:cumulative:auto:top3:x3 | medium | 3 | 100% | 14.52 |
| laya:cumulative:auto:top3:x3 | high | 3 | 100% | 20.43 |
