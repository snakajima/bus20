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
| openai:gpt-5.6-sol:low:consequences:flat | sf-like | low | 9 | 100% | 4.61 | [3.61, 5.63] | 0.1468 | 1952 | - |
| openai:gpt-5.6-sol:low:consequences:flat | tokyo-like | low | 9 | 100% | 2.02 | [1.79, 2.27] | 0.1505 | 1617 | - |
| openai:gpt-5.6-sol:low:consequences:flat | nyc-like | low | 9 | 100% | 7.41 | [5.26, 10.03] | 0.1055 | 2118 | - |
| openai:gpt-5.6-sol:low:consequences:flat | sf-like | medium | 9 | 100% | 10.03 | [7.09, 12.87] | 0.5094 | 2808 | - |
| openai:gpt-5.6-sol:low:consequences:flat | tokyo-like | medium | 9 | 100% | 8.97 | [5.31, 13.89] | 0.5298 | 2545 | - |
| openai:gpt-5.6-sol:low:consequences:flat | nyc-like | medium | 9 | 100% | 28.26 | [18.08, 38.42] | 0.3984 | 3063 | - |
| openai:gpt-5.6-sol:low:consequences:flat | sf-like | high | 9 | 100% | 17.22 | [12.86, 21.85] | 1.1195 | 3384 | - |
| openai:gpt-5.6-sol:low:consequences:flat | tokyo-like | high | 9 | 100% | 13.90 | [9.41, 19.22] | 1.1683 | 3394 | - |
| openai:gpt-5.6-sol:low:consequences:flat | nyc-like | high | 9 | 100% | 30.27 | [21.31, 39.89] | 0.5644 | 3243 | - |
| gemini:gemini-3.8-flash:low:consequences:flat | sf-like | low | 9 | 100% | 4.75 | [3.27, 6.51] | 0.0680 | 1550 | - |
| gemini:gemini-3.8-flash:low:consequences:flat | tokyo-like | low | 9 | 100% | 2.32 | [2.11, 2.56] | 0.0660 | 1191 | - |
| gemini:gemini-3.8-flash:low:consequences:flat | nyc-like | low | 9 | 100% | 5.83 | [5.02, 6.44] | 0.0491 | 1411 | - |
| gemini:gemini-3.8-flash:low:consequences:flat | sf-like | medium | 9 | 100% | 11.66 | [7.93, 15.55] | 0.2238 | 1876 | - |
| gemini:gemini-3.8-flash:low:consequences:flat | tokyo-like | medium | 9 | 100% | 7.42 | [4.11, 11.20] | 0.2216 | 1597 | - |
| gemini:gemini-3.8-flash:low:consequences:flat | nyc-like | medium | 9 | 100% | 21.77 | [15.37, 28.06] | 0.1683 | 1716 | - |
| gemini:gemini-3.8-flash:low:consequences:flat | sf-like | high | 9 | 100% | 15.16 | [12.01, 17.94] | 0.3638 | 2111 | - |
| gemini:gemini-3.8-flash:low:consequences:flat | tokyo-like | high | 9 | 100% | 11.64 | [8.58, 15.10] | 0.4242 | 1916 | - |
| gemini:gemini-3.8-flash:low:consequences:flat | nyc-like | high | 9 | 100% | 30.41 | [25.22, 35.55] | 0.2704 | 2171 | - |
| jev:jev-1.13.0:consequences:tournament:x1 | sf-like | low | 9 | 100% | 6.74 | [4.69, 9.35] | 0.0024 | 130 | - |
| jev:jev-1.13.0:consequences:tournament:x1 | tokyo-like | low | 9 | 100% | 2.64 | [2.27, 2.97] | 0.0022 | 127 | - |
| jev:jev-1.13.0:consequences:tournament:x1 | nyc-like | low | 9 | 100% | 7.64 | [6.04, 9.16] | 0.0018 | 121 | - |
| jev:jev-1.13.0:consequences:tournament:x1 | sf-like | medium | 9 | 100% | 16.17 | [8.90, 25.84] | 0.0084 | 137 | - |
| jev:jev-1.13.0:consequences:tournament:x1 | tokyo-like | medium | 9 | 100% | 20.35 | [6.36, 37.27] | 0.0105 | 135 | - |
| jev:jev-1.13.0:consequences:tournament:x1 | nyc-like | medium | 9 | 100% | 26.19 | [18.35, 33.44] | 0.0072 | 141 | - |
| jev:jev-1.13.0:consequences:tournament:x1 | sf-like | high | 9 | 100% | 34.91 | [19.12, 51.72] | 0.0180 | 147 | - |
| jev:jev-1.13.0:consequences:tournament:x1 | tokyo-like | high | 9 | 100% | 27.14 | [15.52, 40.53] | 0.0227 | 150 | - |
| jev:jev-1.13.0:consequences:tournament:x1 | nyc-like | high | 9 | 100% | 47.15 | [32.86, 63.67] | 0.0126 | 139 | - |

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
| openai:gpt-5.6-sol:low:consequences:flat | sf-like | low | 9 | 9 | 0 | 0 | -0.94 | [-1.59, -0.24] | -23.1 | 3/9 |
| openai:gpt-5.6-sol:low:consequences:flat | tokyo-like | low | 9 | 9 | 0 | 0 | -0.08 | [-0.28, 0.09] | -3.9 | 3/9 |
| openai:gpt-5.6-sol:low:consequences:flat | nyc-like | low | 9 | 9 | 0 | 0 | -1.65 | [-3.99, 0.55] | -33.5 | 3/9 |
| openai:gpt-5.6-sol:low:consequences:flat | sf-like | medium | 9 | 9 | 0 | 0 | -2.70 | [-4.16, -1.22] | -31.3 | 2/9 |
| openai:gpt-5.6-sol:low:consequences:flat | tokyo-like | medium | 9 | 9 | 0 | 0 | -4.03 | [-7.91, -1.21] | -58.6 | 3/9 |
| openai:gpt-5.6-sol:low:consequences:flat | nyc-like | medium | 9 | 9 | 0 | 0 | -12.34 | [-19.72, -5.16] | -62.6 | 3/9 |
| openai:gpt-5.6-sol:low:consequences:flat | sf-like | high | 9 | 9 | 0 | 0 | -4.59 | [-7.62, -2.27] | -37.0 | 0/9 |
| openai:gpt-5.6-sol:low:consequences:flat | tokyo-like | high | 9 | 9 | 0 | 0 | -6.32 | [-10.91, -2.69] | -72.9 | 0/9 |
| openai:gpt-5.6-sol:low:consequences:flat | nyc-like | high | 9 | 9 | 0 | 0 | -9.68 | [-18.52, -1.76] | -44.4 | 4/9 |
| gemini:gemini-3.8-flash:low:consequences:flat | sf-like | low | 9 | 9 | 0 | 0 | -1.08 | [-2.50, 0.09] | -23.3 | 4/9 |
| gemini:gemini-3.8-flash:low:consequences:flat | tokyo-like | low | 9 | 9 | 0 | 0 | -0.39 | [-0.65, -0.17] | -20.7 | 0/9 |
| gemini:gemini-3.8-flash:low:consequences:flat | nyc-like | low | 9 | 9 | 0 | 0 | -0.08 | [-0.60, 0.44] | -7.3 | 3/9 |
| gemini:gemini-3.8-flash:low:consequences:flat | sf-like | medium | 9 | 9 | 0 | 0 | -4.34 | [-6.82, -2.01] | -49.8 | 0/9 |
| gemini:gemini-3.8-flash:low:consequences:flat | tokyo-like | medium | 9 | 9 | 0 | 0 | -2.47 | [-5.40, -0.10] | -33.9 | 3/9 |
| gemini:gemini-3.8-flash:low:consequences:flat | nyc-like | medium | 9 | 9 | 0 | 0 | -5.86 | [-10.02, -1.87] | -28.8 | 3/9 |
| gemini:gemini-3.8-flash:low:consequences:flat | sf-like | high | 9 | 9 | 0 | 0 | -2.54 | [-3.88, -0.99] | -25.0 | 2/9 |
| gemini:gemini-3.8-flash:low:consequences:flat | tokyo-like | high | 9 | 9 | 0 | 0 | -4.05 | [-6.77, -1.83] | -48.2 | 0/9 |
| gemini:gemini-3.8-flash:low:consequences:flat | nyc-like | high | 9 | 9 | 0 | 0 | -9.81 | [-13.77, -6.39] | -47.2 | 0/9 |
| jev:jev-1.13.0:consequences:tournament:x1 | sf-like | low | 9 | 9 | 0 | 0 | -3.07 | [-5.23, -1.24] | -73.4 | 0/9 |
| jev:jev-1.13.0:consequences:tournament:x1 | tokyo-like | low | 9 | 9 | 0 | 0 | -0.71 | [-1.01, -0.36] | -36.7 | 1/9 |
| jev:jev-1.13.0:consequences:tournament:x1 | nyc-like | low | 9 | 9 | 0 | 0 | -1.89 | [-2.60, -1.26] | -35.1 | 0/9 |
| jev:jev-1.13.0:consequences:tournament:x1 | sf-like | medium | 9 | 9 | 0 | 0 | -8.84 | [-17.14, -2.97] | -97.3 | 0/9 |
| jev:jev-1.13.0:consequences:tournament:x1 | tokyo-like | medium | 9 | 9 | 0 | 0 | -15.41 | [-31.68, -2.17] | -228.3 | 1/9 |
| jev:jev-1.13.0:consequences:tournament:x1 | nyc-like | medium | 9 | 9 | 0 | 0 | -10.27 | [-15.00, -5.43] | -55.4 | 0/9 |
| jev:jev-1.13.0:consequences:tournament:x1 | sf-like | high | 9 | 9 | 0 | 0 | -22.29 | [-38.04, -7.60] | -163.2 | 0/9 |
| jev:jev-1.13.0:consequences:tournament:x1 | tokyo-like | high | 9 | 9 | 0 | 0 | -19.56 | [-32.33, -8.84] | -227.2 | 0/9 |
| jev:jev-1.13.0:consequences:tournament:x1 | nyc-like | high | 9 | 9 | 0 | 0 | -26.56 | [-42.52, -13.07] | -128.6 | 0/9 |

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
| openai:gpt-5.6-sol:low:consequences:flat | low | 3 | 100% | 4.68 |
| openai:gpt-5.6-sol:low:consequences:flat | medium | 3 | 100% | 15.75 |
| openai:gpt-5.6-sol:low:consequences:flat | high | 3 | 100% | 20.47 |
| gemini:gemini-3.8-flash:low:consequences:flat | low | 3 | 100% | 4.30 |
| gemini:gemini-3.8-flash:low:consequences:flat | medium | 3 | 100% | 13.62 |
| gemini:gemini-3.8-flash:low:consequences:flat | high | 3 | 100% | 19.07 |
| jev:jev-1.13.0:consequences:tournament:x1 | low | 3 | 100% | 5.67 |
| jev:jev-1.13.0:consequences:tournament:x1 | medium | 3 | 100% | 20.90 |
| jev:jev-1.13.0:consequences:tournament:x1 | high | 3 | 100% | 36.40 |
