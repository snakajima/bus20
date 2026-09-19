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
| rollout-reference:known:k8:s64:h10 | sf-like | low | 9 | 100% | 3.16 | [2.56, 3.87] | n/a | 30 | - |
| rollout-reference:known:k8:s64:h10 | tokyo-like | low | 9 | 100% | 1.82 | [1.66, 1.96] | n/a | 20 | - |
| rollout-reference:known:k8:s64:h10 | nyc-like | low | 9 | 100% | 4.87 | [4.00, 5.73] | n/a | 28 | - |
| rollout-reference:known:k8:s64:h10 | sf-like | medium | 9 | 100% | 6.47 | [5.14, 8.04] | n/a | 139 | - |
| rollout-reference:known:k8:s64:h10 | tokyo-like | medium | 9 | 100% | 4.78 | [3.71, 5.93] | n/a | 161 | - |
| rollout-reference:known:k8:s64:h10 | nyc-like | medium | 9 | 100% | 13.79 | [10.60, 16.81] | n/a | 111 | - |
| rollout-reference:known:k8:s64:h10 | sf-like | high | 9 | 100% | 9.60 | [7.51, 11.65] | n/a | 277 | - |
| rollout-reference:known:k8:s64:h10 | tokyo-like | high | 9 | 100% | 7.12 | [5.47, 8.75] | n/a | 251 | - |
| rollout-reference:known:k8:s64:h10 | nyc-like | high | 9 | 100% | 17.39 | [15.40, 19.52] | n/a | 176 | - |
| gemini:gemini-3.8-flash:low:consequences:flat | sf-like | low | 9 | 100% | 4.75 | [3.22, 6.47] | 0.0680 | 1550 | - |
| gemini:gemini-3.8-flash:low:consequences:flat | tokyo-like | low | 9 | 100% | 2.32 | [2.11, 2.57] | 0.0660 | 1191 | - |
| gemini:gemini-3.8-flash:low:consequences:flat | nyc-like | low | 9 | 100% | 5.83 | [5.02, 6.59] | 0.0491 | 1411 | - |
| gemini:gemini-3.8-flash:low:consequences:flat | sf-like | medium | 9 | 100% | 11.66 | [7.87, 15.54] | 0.2238 | 1876 | - |
| gemini:gemini-3.8-flash:low:consequences:flat | tokyo-like | medium | 9 | 100% | 7.42 | [4.27, 11.23] | 0.2216 | 1597 | - |
| gemini:gemini-3.8-flash:low:consequences:flat | nyc-like | medium | 9 | 100% | 21.77 | [14.95, 28.80] | 0.1683 | 1716 | - |
| gemini:gemini-3.8-flash:low:consequences:flat | sf-like | high | 9 | 100% | 15.16 | [12.05, 18.16] | 0.3638 | 2111 | - |
| gemini:gemini-3.8-flash:low:consequences:flat | tokyo-like | high | 9 | 100% | 11.64 | [8.61, 15.30] | 0.4242 | 1916 | - |
| gemini:gemini-3.8-flash:low:consequences:flat | nyc-like | high | 9 | 100% | 30.41 | [25.32, 35.64] | 0.2704 | 2171 | - |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | sf-like | low | 9 | 100% | 3.71 | [3.03, 4.58] | 0.0473 | 1502 | - |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | tokyo-like | low | 9 | 100% | 2.17 | [1.97, 2.41] | 0.0528 | 1543 | - |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | nyc-like | low | 9 | 100% | 5.54 | [4.61, 6.58] | 0.0390 | 1563 | - |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | sf-like | medium | 9 | 100% | 9.41 | [5.82, 13.15] | 0.1234 | 1788 | - |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | tokyo-like | medium | 9 | 100% | 5.45 | [3.64, 7.54] | 0.1256 | 1539 | - |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | nyc-like | medium | 9 | 100% | 15.93 | [12.26, 19.24] | 0.0965 | 1654 | - |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | sf-like | high | 9 | 100% | 13.49 | [9.90, 16.51] | 0.1729 | 1761 | - |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | tokyo-like | high | 9 | 100% | 9.80 | [7.81, 11.70] | 0.2005 | 1734 | - |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | nyc-like | high | 9 | 100% | 23.62 | [19.47, 27.57] | 0.1333 | 1726 | - |
| gemini:gemini-3.8-flash:low:forecast:auto:top8 | sf-like | low | 9 | 100% | 3.73 | [3.14, 4.41] | 0.0508 | 1424 | - |
| gemini:gemini-3.8-flash:low:forecast:auto:top8 | tokyo-like | low | 9 | 100% | 2.01 | [1.69, 2.37] | 0.0539 | 1498 | - |
| gemini:gemini-3.8-flash:low:forecast:auto:top8 | nyc-like | low | 9 | 100% | 5.14 | [4.57, 5.76] | 0.0396 | 1461 | - |
| gemini:gemini-3.8-flash:low:forecast:auto:top8 | sf-like | medium | 9 | 100% | 8.83 | [6.78, 11.16] | 0.1148 | 1537 | - |
| gemini:gemini-3.8-flash:low:forecast:auto:top8 | tokyo-like | medium | 9 | 100% | 5.59 | [4.02, 7.40] | 0.1313 | 1461 | - |
| gemini:gemini-3.8-flash:low:forecast:auto:top8 | nyc-like | medium | 9 | 100% | 15.97 | [12.93, 18.75] | 0.0973 | 1563 | - |
| gemini:gemini-3.8-flash:low:forecast:auto:top8 | sf-like | high | 9 | 100% | 12.92 | [9.81, 15.99] | 0.1639 | 1616 | - |
| gemini:gemini-3.8-flash:low:forecast:auto:top8 | tokyo-like | high | 9 | 100% | 8.65 | [6.76, 10.38] | 0.1855 | 1561 | - |
| gemini:gemini-3.8-flash:low:forecast:auto:top8 | nyc-like | high | 9 | 100% | 25.19 | [22.06, 28.45] | 0.1293 | 1558 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | sf-like | low | 9 | 100% | 3.90 | [3.15, 4.76] | 0.0018 | 133 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | tokyo-like | low | 9 | 100% | 2.41 | [2.30, 2.53] | 0.0019 | 135 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | nyc-like | low | 9 | 100% | 5.66 | [4.80, 6.55] | 0.0014 | 124 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | sf-like | medium | 9 | 100% | 9.42 | [7.18, 11.82] | 0.0038 | 132 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | tokyo-like | medium | 9 | 100% | 7.35 | [4.60, 10.33] | 0.0043 | 132 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | nyc-like | medium | 9 | 100% | 18.89 | [13.43, 24.56] | 0.0029 | 127 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | sf-like | high | 9 | 100% | 14.83 | [11.85, 17.92] | 0.0051 | 131 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | tokyo-like | high | 9 | 100% | 9.48 | [8.04, 10.94] | 0.0057 | 131 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | nyc-like | high | 9 | 100% | 27.90 | [23.68, 31.71] | 0.0039 | 131 | - |
| jev:jev-1.13.0:forecast:auto:top8:x1 | sf-like | low | 9 | 100% | 3.55 | [2.92, 4.23] | 0.0021 | 133 | - |
| jev:jev-1.13.0:forecast:auto:top8:x1 | tokyo-like | low | 9 | 100% | 2.36 | [2.17, 2.57] | 0.0024 | 136 | - |
| jev:jev-1.13.0:forecast:auto:top8:x1 | nyc-like | low | 9 | 100% | 5.68 | [4.77, 6.63] | 0.0017 | 131 | - |
| jev:jev-1.13.0:forecast:auto:top8:x1 | sf-like | medium | 9 | 100% | 9.21 | [6.50, 12.38] | 0.0046 | 132 | - |
| jev:jev-1.13.0:forecast:auto:top8:x1 | tokyo-like | medium | 9 | 100% | 6.54 | [4.45, 8.93] | 0.0053 | 129 | - |
| jev:jev-1.13.0:forecast:auto:top8:x1 | nyc-like | medium | 9 | 100% | 18.59 | [14.25, 22.69] | 0.0036 | 130 | - |
| jev:jev-1.13.0:forecast:auto:top8:x1 | sf-like | high | 9 | 100% | 13.65 | [10.49, 16.55] | 0.0062 | 133 | - |
| jev:jev-1.13.0:forecast:auto:top8:x1 | tokyo-like | high | 9 | 100% | 10.05 | [7.57, 12.66] | 0.0069 | 131 | - |
| jev:jev-1.13.0:forecast:auto:top8:x1 | nyc-like | high | 9 | 100% | 22.18 | [18.79, 25.61] | 0.0048 | 129 | - |

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
| rollout-reference:known:k8:s64:h10 | sf-like | low | 9 | 9 | 0 | 0 | 0.51 | [0.14, 0.82] | 15.3 | 8/9 |
| rollout-reference:known:k8:s64:h10 | tokyo-like | low | 9 | 9 | 0 | 0 | 0.11 | [-0.06, 0.29] | 5.5 | 6/9 |
| rollout-reference:known:k8:s64:h10 | nyc-like | low | 9 | 9 | 0 | 0 | 0.88 | [0.33, 1.44] | 12.1 | 6/9 |
| rollout-reference:known:k8:s64:h10 | sf-like | medium | 9 | 9 | 0 | 0 | 0.86 | [0.48, 1.23] | 12.4 | 8/9 |
| rollout-reference:known:k8:s64:h10 | tokyo-like | medium | 9 | 9 | 0 | 0 | 0.16 | [-0.12, 0.43] | 4.1 | 6/9 |
| rollout-reference:known:k8:s64:h10 | nyc-like | medium | 9 | 9 | 0 | 0 | 2.13 | [1.41, 2.82] | 15.5 | 9/9 |
| rollout-reference:known:k8:s64:h10 | sf-like | high | 9 | 9 | 0 | 0 | 3.03 | [1.42, 4.68] | 21.4 | 9/9 |
| rollout-reference:known:k8:s64:h10 | tokyo-like | high | 9 | 9 | 0 | 0 | 0.46 | [-0.28, 1.11] | 8.8 | 6/9 |
| rollout-reference:known:k8:s64:h10 | nyc-like | high | 9 | 9 | 0 | 0 | 3.21 | [1.98, 4.47] | 14.7 | 8/9 |
| gemini:gemini-3.8-flash:low:consequences:flat | sf-like | low | 9 | 9 | 0 | 0 | -1.08 | [-2.44, 0.10] | -23.3 | 4/9 |
| gemini:gemini-3.8-flash:low:consequences:flat | tokyo-like | low | 9 | 9 | 0 | 0 | -0.39 | [-0.67, -0.16] | -20.7 | 0/9 |
| gemini:gemini-3.8-flash:low:consequences:flat | nyc-like | low | 9 | 9 | 0 | 0 | -0.08 | [-0.60, 0.51] | -7.3 | 3/9 |
| gemini:gemini-3.8-flash:low:consequences:flat | sf-like | medium | 9 | 9 | 0 | 0 | -4.34 | [-6.77, -1.97] | -49.8 | 0/9 |
| gemini:gemini-3.8-flash:low:consequences:flat | tokyo-like | medium | 9 | 9 | 0 | 0 | -2.47 | [-5.40, -0.16] | -33.9 | 3/9 |
| gemini:gemini-3.8-flash:low:consequences:flat | nyc-like | medium | 9 | 9 | 0 | 0 | -5.86 | [-10.46, -1.72] | -28.8 | 3/9 |
| gemini:gemini-3.8-flash:low:consequences:flat | sf-like | high | 9 | 9 | 0 | 0 | -2.54 | [-3.86, -1.09] | -25.0 | 2/9 |
| gemini:gemini-3.8-flash:low:consequences:flat | tokyo-like | high | 9 | 9 | 0 | 0 | -4.05 | [-6.94, -1.89] | -48.2 | 0/9 |
| gemini:gemini-3.8-flash:low:consequences:flat | nyc-like | high | 9 | 9 | 0 | 0 | -9.81 | [-13.73, -6.59] | -47.2 | 0/9 |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | sf-like | low | 9 | 9 | 0 | 0 | -0.04 | [-0.47, 0.26] | 1.5 | 6/9 |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | tokyo-like | low | 9 | 9 | 0 | 0 | -0.24 | [-0.40, -0.09] | -11.9 | 3/9 |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | nyc-like | low | 9 | 9 | 0 | 0 | 0.21 | [-1.05, 1.56] | -4.6 | 3/9 |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | sf-like | medium | 9 | 9 | 0 | 0 | -2.08 | [-4.29, 0.01] | -19.5 | 4/9 |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | tokyo-like | medium | 9 | 9 | 0 | 0 | -0.51 | [-1.54, 0.41] | -3.7 | 6/9 |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | nyc-like | medium | 9 | 9 | 0 | 0 | -0.01 | [-1.48, 1.22] | 2.6 | 5/9 |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | sf-like | high | 9 | 9 | 0 | 0 | -0.86 | [-1.99, 0.52] | -7.0 | 2/9 |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | tokyo-like | high | 9 | 9 | 0 | 0 | -2.21 | [-3.51, -1.01] | -27.1 | 2/9 |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | nyc-like | high | 9 | 9 | 0 | 0 | -3.03 | [-5.99, -0.67] | -14.3 | 4/9 |
| gemini:gemini-3.8-flash:low:forecast:auto:top8 | sf-like | low | 9 | 9 | 0 | 0 | -0.06 | [-0.30, 0.18] | -0.3 | 3/9 |
| gemini:gemini-3.8-flash:low:forecast:auto:top8 | tokyo-like | low | 9 | 9 | 0 | 0 | -0.08 | [-0.36, 0.21] | -3.0 | 3/9 |
| gemini:gemini-3.8-flash:low:forecast:auto:top8 | nyc-like | low | 9 | 9 | 0 | 0 | 0.61 | [-0.36, 1.68] | 1.9 | 3/9 |
| gemini:gemini-3.8-flash:low:forecast:auto:top8 | sf-like | medium | 9 | 9 | 0 | 0 | -1.50 | [-2.31, -0.79] | -18.1 | 0/9 |
| gemini:gemini-3.8-flash:low:forecast:auto:top8 | tokyo-like | medium | 9 | 9 | 0 | 0 | -0.65 | [-1.50, 0.11] | -8.6 | 5/9 |
| gemini:gemini-3.8-flash:low:forecast:auto:top8 | nyc-like | medium | 9 | 9 | 0 | 0 | -0.05 | [-0.33, 0.16] | 0.0 | 3/9 |
| gemini:gemini-3.8-flash:low:forecast:auto:top8 | sf-like | high | 9 | 9 | 0 | 0 | -0.29 | [-2.45, 1.89] | -4.8 | 3/9 |
| gemini:gemini-3.8-flash:low:forecast:auto:top8 | tokyo-like | high | 9 | 9 | 0 | 0 | -1.07 | [-2.09, 0.01] | -11.2 | 3/9 |
| gemini:gemini-3.8-flash:low:forecast:auto:top8 | nyc-like | high | 9 | 9 | 0 | 0 | -4.60 | [-7.73, -1.61] | -24.3 | 2/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | sf-like | low | 9 | 9 | 0 | 0 | -0.23 | [-0.68, 0.15] | -4.1 | 4/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | tokyo-like | low | 9 | 9 | 0 | 0 | -0.48 | [-0.57, -0.40] | -24.9 | 0/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | nyc-like | low | 9 | 9 | 0 | 0 | 0.09 | [-1.08, 1.31] | -6.4 | 3/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | sf-like | medium | 9 | 9 | 0 | 0 | -2.09 | [-3.40, -0.88] | -27.1 | 0/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | tokyo-like | medium | 9 | 9 | 0 | 0 | -2.41 | [-4.51, -0.62] | -36.1 | 3/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | nyc-like | medium | 9 | 9 | 0 | 0 | -2.97 | [-6.41, 0.07] | -12.4 | 4/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | sf-like | high | 9 | 9 | 0 | 0 | -2.20 | [-3.86, -0.30] | -23.2 | 2/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | tokyo-like | high | 9 | 9 | 0 | 0 | -1.90 | [-2.54, -1.31] | -24.2 | 0/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | nyc-like | high | 9 | 9 | 0 | 0 | -7.31 | [-9.68, -5.13] | -35.8 | 0/9 |
| jev:jev-1.13.0:forecast:auto:top8:x1 | sf-like | low | 9 | 9 | 0 | 0 | 0.11 | [-0.20, 0.35] | 4.6 | 7/9 |
| jev:jev-1.13.0:forecast:auto:top8:x1 | tokyo-like | low | 9 | 9 | 0 | 0 | -0.43 | [-0.55, -0.32] | -21.7 | 0/9 |
| jev:jev-1.13.0:forecast:auto:top8:x1 | nyc-like | low | 9 | 9 | 0 | 0 | 0.07 | [-0.80, 0.97] | -4.1 | 4/9 |
| jev:jev-1.13.0:forecast:auto:top8:x1 | sf-like | medium | 9 | 9 | 0 | 0 | -1.88 | [-3.73, -0.54] | -20.6 | 1/9 |
| jev:jev-1.13.0:forecast:auto:top8:x1 | tokyo-like | medium | 9 | 9 | 0 | 0 | -1.60 | [-3.01, -0.38] | -24.8 | 0/9 |
| jev:jev-1.13.0:forecast:auto:top8:x1 | nyc-like | medium | 9 | 9 | 0 | 0 | -2.67 | [-4.61, -0.70] | -13.8 | 2/9 |
| jev:jev-1.13.0:forecast:auto:top8:x1 | sf-like | high | 9 | 9 | 0 | 0 | -1.02 | [-2.09, 0.15] | -10.0 | 2/9 |
| jev:jev-1.13.0:forecast:auto:top8:x1 | tokyo-like | high | 9 | 9 | 0 | 0 | -2.47 | [-4.26, -0.80] | -28.1 | 0/9 |
| jev:jev-1.13.0:forecast:auto:top8:x1 | nyc-like | high | 9 | 9 | 0 | 0 | -1.58 | [-3.01, -0.39] | -6.7 | 2/9 |

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
| rollout-reference:known:k8:s64:h10 | low | 3 | 100% | 3.28 |
| rollout-reference:known:k8:s64:h10 | medium | 3 | 100% | 8.35 |
| rollout-reference:known:k8:s64:h10 | high | 3 | 100% | 11.37 |
| gemini:gemini-3.8-flash:low:consequences:flat | low | 3 | 100% | 4.30 |
| gemini:gemini-3.8-flash:low:consequences:flat | medium | 3 | 100% | 13.62 |
| gemini:gemini-3.8-flash:low:consequences:flat | high | 3 | 100% | 19.07 |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | low | 3 | 100% | 3.81 |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | medium | 3 | 100% | 10.26 |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | high | 3 | 100% | 15.64 |
| gemini:gemini-3.8-flash:low:forecast:auto:top8 | low | 3 | 100% | 3.63 |
| gemini:gemini-3.8-flash:low:forecast:auto:top8 | medium | 3 | 100% | 10.13 |
| gemini:gemini-3.8-flash:low:forecast:auto:top8 | high | 3 | 100% | 15.59 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | low | 3 | 100% | 3.99 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | medium | 3 | 100% | 11.89 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | high | 3 | 100% | 17.40 |
| jev:jev-1.13.0:forecast:auto:top8:x1 | low | 3 | 100% | 3.86 |
| jev:jev-1.13.0:forecast:auto:top8:x1 | medium | 3 | 100% | 11.44 |
| jev:jev-1.13.0:forecast:auto:top8:x1 | high | 3 | 100% | 15.29 |
