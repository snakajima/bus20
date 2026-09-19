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
| random-reference:top8 | sf-like | low | 9 | 100% | 54.12 | [39.18, 67.61] | n/a | 0 | - |
| random-reference:top8 | sf-like | medium | 9 | 100% | 55.61 | [46.43, 65.08] | n/a | 0 | - |
| random-reference:top8 | sf-like | high | 9 | 100% | 66.47 | [55.98, 77.92] | n/a | 0 | - |
| random-reference:top8 | tokyo-like | low | 9 | 100% | 27.88 | [20.53, 34.92] | n/a | 0 | - |
| random-reference:top8 | tokyo-like | medium | 9 | 100% | 50.94 | [38.10, 66.23] | n/a | 0 | - |
| random-reference:top8 | tokyo-like | high | 9 | 100% | 38.98 | [30.04, 51.20] | n/a | 0 | - |
| random-reference:top8 | nyc-like | low | 9 | 100% | 80.11 | [61.02, 105.84] | n/a | 0 | - |
| random-reference:top8 | nyc-like | medium | 9 | 100% | 114.92 | [105.72, 125.86] | n/a | 0 | - |
| random-reference:top8 | nyc-like | high | 9 | 100% | 131.26 | [106.63, 159.16] | n/a | 0 | - |
| random-reference:all | sf-like | low | 9 | 100% | 1000.37 | [460.40, 1730.64] | n/a | 0 | - |
| random-reference:all | sf-like | medium | 9 | 33% | 2053.08 | [1623.35, 2317.96] | n/a | 0 | deadlineExceeded:6 |
| random-reference:all | sf-like | high | 9 | 0% | n/a | n/a | n/a | 0 | deadlineExceeded:9 |
| random-reference:all | tokyo-like | low | 9 | 100% | 745.56 | [541.91, 943.74] | n/a | 0 | - |
| random-reference:all | tokyo-like | medium | 9 | 11% | 2030.16 | n/a | n/a | 0 | deadlineExceeded:8 |
| random-reference:all | tokyo-like | high | 9 | 0% | n/a | n/a | n/a | 0 | deadlineExceeded:9 |
| random-reference:all | nyc-like | low | 9 | 89% | 2151.20 | [1656.67, 2582.58] | n/a | 0 | deadlineExceeded:1 |
| random-reference:all | nyc-like | medium | 9 | 22% | 4098.15 | [3286.98, 4909.32] | n/a | 0 | deadlineExceeded:7 |
| random-reference:all | nyc-like | high | 9 | 0% | n/a | n/a | n/a | 0 | deadlineExceeded:9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | sf-like | low | 9 | 100% | 3.90 | [3.13, 4.75] | 0.0018 | 133 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | tokyo-like | low | 9 | 100% | 2.41 | [2.30, 2.53] | 0.0019 | 135 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | nyc-like | low | 9 | 100% | 5.66 | [4.78, 6.62] | 0.0014 | 124 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | sf-like | medium | 9 | 100% | 9.42 | [7.22, 11.93] | 0.0038 | 132 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | tokyo-like | medium | 9 | 100% | 7.35 | [4.60, 10.48] | 0.0043 | 132 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | nyc-like | medium | 9 | 100% | 18.89 | [13.69, 24.53] | 0.0029 | 127 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | sf-like | high | 9 | 100% | 14.83 | [11.74, 17.73] | 0.0051 | 131 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | tokyo-like | high | 9 | 100% | 9.48 | [7.95, 11.04] | 0.0057 | 131 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | nyc-like | high | 9 | 100% | 27.90 | [23.92, 31.77] | 0.0039 | 131 | - |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | sf-like | low | 9 | 100% | 3.71 | [3.00, 4.58] | 0.0473 | 1502 | - |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | tokyo-like | low | 9 | 100% | 2.17 | [1.97, 2.42] | 0.0528 | 1543 | - |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | nyc-like | low | 9 | 100% | 5.54 | [4.63, 6.59] | 0.0390 | 1563 | - |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | sf-like | medium | 9 | 100% | 9.41 | [5.89, 13.17] | 0.1234 | 1788 | - |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | tokyo-like | medium | 9 | 100% | 5.45 | [3.78, 7.43] | 0.1256 | 1539 | - |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | nyc-like | medium | 9 | 100% | 15.93 | [11.99, 19.54] | 0.0965 | 1654 | - |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | sf-like | high | 9 | 100% | 13.49 | [10.31, 16.51] | 0.1729 | 1761 | - |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | tokyo-like | high | 9 | 100% | 9.80 | [7.85, 11.60] | 0.2005 | 1734 | - |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | nyc-like | high | 9 | 100% | 23.62 | [19.76, 27.48] | 0.1333 | 1726 | - |

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
| random-reference:top8 | sf-like | low | 9 | 9 | 0 | 0 | -50.46 | [-63.99, -35.70] | -1385.4 | 0/9 |
| random-reference:top8 | sf-like | medium | 9 | 9 | 0 | 0 | -48.28 | [-57.33, -40.02] | -703.6 | 0/9 |
| random-reference:top8 | sf-like | high | 9 | 9 | 0 | 0 | -53.84 | [-65.48, -43.01] | -522.3 | 0/9 |
| random-reference:top8 | tokyo-like | low | 9 | 9 | 0 | 0 | -25.94 | [-33.01, -18.61] | -1347.3 | 0/9 |
| random-reference:top8 | tokyo-like | medium | 9 | 9 | 0 | 0 | -46.00 | [-60.97, -33.48] | -998.7 | 0/9 |
| random-reference:top8 | tokyo-like | high | 9 | 9 | 0 | 0 | -31.40 | [-42.95, -23.07] | -405.7 | 0/9 |
| random-reference:top8 | nyc-like | low | 9 | 9 | 0 | 0 | -74.36 | [-99.88, -55.09] | -1463.9 | 0/9 |
| random-reference:top8 | nyc-like | medium | 9 | 9 | 0 | 0 | -99.00 | [-109.52, -89.75] | -673.7 | 0/9 |
| random-reference:top8 | nyc-like | high | 9 | 9 | 0 | 0 | -110.67 | [-137.70, -87.52] | -541.3 | 0/9 |
| random-reference:all | sf-like | low | 9 | 9 | 0 | 0 | -996.70 | [-1731.30, -458.68] | -26716.6 | 0/9 |
| random-reference:all | sf-like | medium | 9 | 3 | 6 | 0 | -2047.09 | [-2311.52, -1616.90] | -34790.2 | 0/3 |
| random-reference:all | sf-like | high | 9 | 0 | 9 | 0 | n/a | n/a | n/a | 0/0 |
| random-reference:all | tokyo-like | low | 9 | 9 | 0 | 0 | -743.62 | [-942.20, -540.21] | -38214.3 | 0/9 |
| random-reference:all | tokyo-like | medium | 9 | 1 | 8 | 0 | -2026.93 | n/a | -62672.5 | 0/1 |
| random-reference:all | tokyo-like | high | 9 | 0 | 9 | 0 | n/a | n/a | n/a | 0/0 |
| random-reference:all | nyc-like | low | 9 | 8 | 1 | 0 | -2145.70 | [-2583.56, -1655.92] | -43621.7 | 0/8 |
| random-reference:all | nyc-like | medium | 9 | 2 | 7 | 0 | -4082.99 | [-4889.22, -3276.76] | -28197.8 | 0/2 |
| random-reference:all | nyc-like | high | 9 | 0 | 9 | 0 | n/a | n/a | n/a | 0/0 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | sf-like | low | 9 | 9 | 0 | 0 | -0.23 | [-0.68, 0.16] | -4.1 | 4/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | tokyo-like | low | 9 | 9 | 0 | 0 | -0.48 | [-0.56, -0.40] | -24.9 | 0/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | nyc-like | low | 9 | 9 | 0 | 0 | 0.09 | [-1.08, 1.31] | -6.4 | 3/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | sf-like | medium | 9 | 9 | 0 | 0 | -2.09 | [-3.45, -0.97] | -27.1 | 0/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | tokyo-like | medium | 9 | 9 | 0 | 0 | -2.41 | [-4.51, -0.62] | -36.1 | 3/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | nyc-like | medium | 9 | 9 | 0 | 0 | -2.97 | [-6.35, -0.01] | -12.4 | 4/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | sf-like | high | 9 | 9 | 0 | 0 | -2.20 | [-3.89, -0.20] | -23.2 | 2/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | tokyo-like | high | 9 | 9 | 0 | 0 | -1.90 | [-2.57, -1.28] | -24.2 | 0/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | nyc-like | high | 9 | 9 | 0 | 0 | -7.31 | [-9.73, -5.17] | -35.8 | 0/9 |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | sf-like | low | 9 | 9 | 0 | 0 | -0.04 | [-0.47, 0.26] | 1.5 | 6/9 |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | tokyo-like | low | 9 | 9 | 0 | 0 | -0.24 | [-0.41, -0.09] | -11.9 | 3/9 |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | nyc-like | low | 9 | 9 | 0 | 0 | 0.21 | [-0.84, 1.56] | -4.6 | 3/9 |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | sf-like | medium | 9 | 9 | 0 | 0 | -2.08 | [-4.27, -0.29] | -19.5 | 4/9 |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | tokyo-like | medium | 9 | 9 | 0 | 0 | -0.51 | [-1.43, 0.37] | -3.7 | 6/9 |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | nyc-like | medium | 9 | 9 | 0 | 0 | -0.01 | [-1.42, 1.22] | 2.6 | 5/9 |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | sf-like | high | 9 | 9 | 0 | 0 | -0.86 | [-2.00, 0.57] | -7.0 | 2/9 |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | tokyo-like | high | 9 | 9 | 0 | 0 | -2.21 | [-3.51, -1.04] | -27.1 | 2/9 |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | nyc-like | high | 9 | 9 | 0 | 0 | -3.03 | [-5.97, -0.74] | -14.3 | 4/9 |

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
| random-reference:top8 | low | 3 | 100% | 54.04 |
| random-reference:top8 | medium | 3 | 100% | 73.82 |
| random-reference:top8 | high | 3 | 100% | 78.90 |
| random-reference:all | low | 3 | 96% | 1299.04 |
| random-reference:all | medium | 3 | 22% | 2727.13 |
| random-reference:all | high | 3 | 0% | n/a |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | low | 3 | 100% | 3.99 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | medium | 3 | 100% | 11.89 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | high | 3 | 100% | 17.40 |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | low | 3 | 100% | 3.81 |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | medium | 3 | 100% | 10.26 |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | high | 3 | 100% | 15.64 |
