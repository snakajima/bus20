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
| random-reference:top8 | sf-like | low | 9 | 100% | 54.12 | [39.65, 67.25] | n/a | 0 | - |
| random-reference:top8 | sf-like | medium | 9 | 100% | 55.61 | [46.44, 65.10] | n/a | 0 | - |
| random-reference:top8 | sf-like | high | 9 | 100% | 66.47 | [56.18, 77.67] | n/a | 0 | - |
| random-reference:top8 | tokyo-like | low | 9 | 100% | 27.88 | [20.45, 34.89] | n/a | 0 | - |
| random-reference:top8 | tokyo-like | medium | 9 | 100% | 50.94 | [38.14, 66.40] | n/a | 0 | - |
| random-reference:top8 | tokyo-like | high | 9 | 100% | 38.98 | [29.71, 50.97] | n/a | 0 | - |
| random-reference:top8 | nyc-like | low | 9 | 100% | 80.11 | [61.09, 105.40] | n/a | 0 | - |
| random-reference:top8 | nyc-like | medium | 9 | 100% | 114.92 | [105.65, 125.14] | n/a | 0 | - |
| random-reference:top8 | nyc-like | high | 9 | 100% | 131.26 | [105.74, 160.41] | n/a | 0 | - |
| claude:claude-opus-5:low:cumulative:auto:top8 | sf-like | low | 9 | 100% | 3.97 | [3.22, 4.76] | 0.3137 | 2259 | - |
| claude:claude-opus-5:low:cumulative:auto:top8 | tokyo-like | low | 9 | 100% | 2.11 | [1.88, 2.36] | 0.3416 | 2189 | - |
| claude:claude-opus-5:low:cumulative:auto:top8 | nyc-like | low | 9 | 100% | 5.66 | [4.47, 6.95] | 0.2358 | 2111 | - |
| claude:claude-opus-5:low:cumulative:auto:top8 | sf-like | medium | 9 | 100% | 8.84 | [6.61, 11.27] | 0.6760 | 2450 | - |
| claude:claude-opus-5:low:cumulative:auto:top8 | tokyo-like | medium | 9 | 100% | 7.52 | [4.10, 11.29] | 0.7381 | 2032 | - |
| claude:claude-opus-5:low:cumulative:auto:top8 | nyc-like | medium | 9 | 100% | 14.60 | [11.37, 17.24] | 0.5189 | 2327 | - |
| claude:claude-opus-5:low:cumulative:auto:top8 | sf-like | high | 9 | 100% | 13.01 | [10.01, 16.13] | 0.8985 | 2351 | - |
| claude:claude-opus-5:low:cumulative:auto:top8 | tokyo-like | high | 9 | 100% | 7.79 | [6.82, 8.72] | 0.9885 | 2339 | - |
| claude:claude-opus-5:low:cumulative:auto:top8 | nyc-like | high | 9 | 100% | 23.85 | [19.91, 27.54] | 0.6910 | 2160 | - |
| claude:claude-opus-5:low:forecast:auto:top8 | sf-like | low | 9 | 100% | 3.75 | [3.19, 4.41] | 0.3891 | 2224 | - |
| claude:claude-opus-5:low:forecast:auto:top8 | tokyo-like | low | 9 | 100% | 2.14 | [1.90, 2.43] | 0.4236 | 2001 | - |
| claude:claude-opus-5:low:forecast:auto:top8 | nyc-like | low | 9 | 100% | 5.61 | [4.87, 6.30] | 0.3005 | 2032 | - |
| claude:claude-opus-5:low:forecast:auto:top8 | sf-like | medium | 9 | 100% | 8.22 | [6.24, 10.59] | 0.8131 | 2018 | - |
| claude:claude-opus-5:low:forecast:auto:top8 | tokyo-like | medium | 9 | 100% | 5.65 | [3.90, 7.69] | 0.9255 | 1994 | - |
| claude:claude-opus-5:low:forecast:auto:top8 | nyc-like | medium | 9 | 100% | 18.22 | [13.40, 22.80] | 0.6370 | 2034 | - |
| claude:claude-opus-5:low:forecast:auto:top8 | sf-like | high | 9 | 100% | 12.59 | [9.13, 16.17] | 1.0987 | 2081 | - |
| claude:claude-opus-5:low:forecast:auto:top8 | tokyo-like | high | 9 | 100% | 8.85 | [7.16, 10.67] | 1.2239 | 2101 | - |
| claude:claude-opus-5:low:forecast:auto:top8 | nyc-like | high | 9 | 100% | 24.58 | [20.42, 28.74] | 0.8609 | 2229 | - |
| openai:gpt-5.6-sol:low:cumulative:auto:top8 | sf-like | low | 9 | 100% | 3.78 | [3.09, 4.61] | 0.1208 | 1957 | - |
| openai:gpt-5.6-sol:low:cumulative:auto:top8 | tokyo-like | low | 9 | 100% | 1.95 | [1.80, 2.11] | 0.1082 | 2023 | - |
| openai:gpt-5.6-sol:low:cumulative:auto:top8 | nyc-like | low | 9 | 100% | 5.63 | [4.64, 6.63] | 0.0796 | 1821 | - |
| openai:gpt-5.6-sol:low:cumulative:auto:top8 | sf-like | medium | 9 | 100% | 9.43 | [7.01, 12.37] | 0.2761 | 2681 | - |
| openai:gpt-5.6-sol:low:cumulative:auto:top8 | tokyo-like | medium | 9 | 100% | 6.38 | [4.11, 8.99] | 0.3459 | 2567 | - |
| openai:gpt-5.6-sol:low:cumulative:auto:top8 | nyc-like | medium | 9 | 100% | 18.87 | [14.76, 22.82] | 0.2126 | 2560 | - |
| openai:gpt-5.6-sol:low:cumulative:auto:top8 | sf-like | high | 9 | 100% | 12.91 | [9.47, 16.35] | 0.4169 | 2830 | - |
| openai:gpt-5.6-sol:low:cumulative:auto:top8 | tokyo-like | high | 9 | 100% | 9.58 | [7.86, 11.58] | 0.5192 | 2663 | - |
| openai:gpt-5.6-sol:low:cumulative:auto:top8 | nyc-like | high | 9 | 100% | 23.69 | [19.38, 27.65] | 0.2324 | 2328 | - |
| openai:gpt-5.6-sol:low:forecast:auto:top8 | sf-like | low | 9 | 100% | 3.87 | [3.15, 4.66] | 0.1258 | 1798 | - |
| openai:gpt-5.6-sol:low:forecast:auto:top8 | tokyo-like | low | 9 | 100% | 2.17 | [1.89, 2.44] | 0.1293 | 2047 | - |
| openai:gpt-5.6-sol:low:forecast:auto:top8 | nyc-like | low | 9 | 100% | 5.38 | [4.52, 6.49] | 0.0972 | 2138 | - |
| openai:gpt-5.6-sol:low:forecast:auto:top8 | sf-like | medium | 9 | 100% | 8.27 | [6.32, 10.72] | 0.3763 | 1901 | - |
| openai:gpt-5.6-sol:low:forecast:auto:top8 | tokyo-like | medium | 9 | 100% | 5.93 | [4.09, 8.05] | 0.4341 | 1777 | - |
| openai:gpt-5.6-sol:low:forecast:auto:top8 | nyc-like | medium | 9 | 100% | 15.68 | [12.47, 19.06] | 0.2366 | 2128 | - |
| openai:gpt-5.6-sol:low:forecast:auto:top8 | sf-like | high | 9 | 100% | 12.20 | [9.25, 15.37] | 0.5435 | 2203 | - |
| openai:gpt-5.6-sol:low:forecast:auto:top8 | tokyo-like | high | 9 | 100% | 8.71 | [6.60, 10.77] | 0.6278 | 2284 | - |
| openai:gpt-5.6-sol:low:forecast:auto:top8 | nyc-like | high | 9 | 100% | 24.62 | [21.02, 28.12] | 0.4371 | 2830 | - |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | sf-like | low | 9 | 100% | 3.71 | [2.93, 4.58] | 0.0473 | 1502 | - |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | tokyo-like | low | 9 | 100% | 2.17 | [1.96, 2.41] | 0.0528 | 1543 | - |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | nyc-like | low | 9 | 100% | 5.54 | [4.57, 6.58] | 0.0390 | 1563 | - |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | sf-like | medium | 9 | 100% | 9.41 | [5.81, 13.24] | 0.1234 | 1788 | - |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | tokyo-like | medium | 9 | 100% | 5.45 | [3.56, 7.47] | 0.1256 | 1539 | - |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | nyc-like | medium | 9 | 100% | 15.93 | [11.87, 19.36] | 0.0965 | 1654 | - |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | sf-like | high | 9 | 100% | 13.49 | [10.13, 16.51] | 0.1729 | 1761 | - |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | tokyo-like | high | 9 | 100% | 9.80 | [7.75, 11.56] | 0.2005 | 1734 | - |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | nyc-like | high | 9 | 100% | 23.62 | [19.37, 27.46] | 0.1333 | 1726 | - |
| gemini:gemini-3.8-flash:low:forecast:auto:top8 | sf-like | low | 9 | 100% | 3.73 | [3.13, 4.34] | 0.0508 | 1424 | - |
| gemini:gemini-3.8-flash:low:forecast:auto:top8 | tokyo-like | low | 9 | 100% | 2.01 | [1.69, 2.37] | 0.0539 | 1498 | - |
| gemini:gemini-3.8-flash:low:forecast:auto:top8 | nyc-like | low | 9 | 100% | 5.14 | [4.57, 5.71] | 0.0396 | 1461 | - |
| gemini:gemini-3.8-flash:low:forecast:auto:top8 | sf-like | medium | 9 | 100% | 8.83 | [6.84, 11.01] | 0.1148 | 1537 | - |
| gemini:gemini-3.8-flash:low:forecast:auto:top8 | tokyo-like | medium | 9 | 100% | 5.59 | [4.07, 7.41] | 0.1313 | 1461 | - |
| gemini:gemini-3.8-flash:low:forecast:auto:top8 | nyc-like | medium | 9 | 100% | 15.97 | [13.16, 18.52] | 0.0973 | 1563 | - |
| gemini:gemini-3.8-flash:low:forecast:auto:top8 | sf-like | high | 9 | 100% | 12.92 | [9.71, 16.13] | 0.1639 | 1616 | - |
| gemini:gemini-3.8-flash:low:forecast:auto:top8 | tokyo-like | high | 9 | 100% | 8.65 | [6.75, 10.36] | 0.1855 | 1561 | - |
| gemini:gemini-3.8-flash:low:forecast:auto:top8 | nyc-like | high | 9 | 100% | 25.19 | [22.07, 28.23] | 0.1293 | 1558 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | sf-like | low | 9 | 100% | 3.90 | [3.13, 4.71] | 0.0018 | 133 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | tokyo-like | low | 9 | 100% | 2.41 | [2.30, 2.53] | 0.0019 | 135 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | nyc-like | low | 9 | 100% | 5.66 | [4.83, 6.56] | 0.0014 | 124 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | sf-like | medium | 9 | 100% | 9.42 | [7.30, 11.92] | 0.0038 | 132 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | tokyo-like | medium | 9 | 100% | 7.35 | [4.64, 10.41] | 0.0043 | 132 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | nyc-like | medium | 9 | 100% | 18.89 | [13.03, 25.06] | 0.0029 | 127 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | sf-like | high | 9 | 100% | 14.83 | [11.87, 17.79] | 0.0051 | 131 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | tokyo-like | high | 9 | 100% | 9.48 | [7.99, 10.94] | 0.0057 | 131 | - |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | nyc-like | high | 9 | 100% | 27.90 | [23.94, 31.88] | 0.0039 | 131 | - |
| jev:jev-1.13.0:forecast:auto:top8:x1 | sf-like | low | 9 | 100% | 3.55 | [2.96, 4.22] | 0.0021 | 133 | - |
| jev:jev-1.13.0:forecast:auto:top8:x1 | tokyo-like | low | 9 | 100% | 2.36 | [2.17, 2.57] | 0.0024 | 136 | - |
| jev:jev-1.13.0:forecast:auto:top8:x1 | nyc-like | low | 9 | 100% | 5.68 | [4.73, 6.63] | 0.0017 | 131 | - |
| jev:jev-1.13.0:forecast:auto:top8:x1 | sf-like | medium | 9 | 100% | 9.21 | [6.59, 12.54] | 0.0046 | 132 | - |
| jev:jev-1.13.0:forecast:auto:top8:x1 | tokyo-like | medium | 9 | 100% | 6.54 | [4.58, 8.82] | 0.0053 | 129 | - |
| jev:jev-1.13.0:forecast:auto:top8:x1 | nyc-like | medium | 9 | 100% | 18.59 | [13.85, 22.43] | 0.0036 | 130 | - |
| jev:jev-1.13.0:forecast:auto:top8:x1 | sf-like | high | 9 | 100% | 13.65 | [10.53, 16.49] | 0.0062 | 133 | - |
| jev:jev-1.13.0:forecast:auto:top8:x1 | tokyo-like | high | 9 | 100% | 10.05 | [7.66, 12.67] | 0.0069 | 131 | - |
| jev:jev-1.13.0:forecast:auto:top8:x1 | nyc-like | high | 9 | 100% | 22.18 | [18.46, 25.54] | 0.0048 | 129 | - |
| laya:cumulative:auto:top3:x3 | sf-like | low | 9 | 100% | 5.79 | [4.51, 7.10] | n/a | 4736 | - |
| laya:cumulative:auto:top3:x3 | tokyo-like | low | 9 | 100% | 3.62 | [2.93, 4.31] | n/a | 3008 | - |
| laya:cumulative:auto:top3:x3 | nyc-like | low | 9 | 100% | 9.53 | [8.75, 10.31] | n/a | 2929 | - |
| laya:cumulative:auto:top3:x3 | sf-like | medium | 9 | 100% | 12.47 | [10.10, 15.07] | n/a | 3787 | - |
| laya:cumulative:auto:top3:x3 | tokyo-like | medium | 9 | 100% | 9.58 | [7.84, 11.83] | n/a | 2221 | - |
| laya:cumulative:auto:top3:x3 | nyc-like | medium | 9 | 100% | 21.51 | [16.12, 26.91] | n/a | 1911 | - |
| laya:cumulative:auto:top3:x3 | sf-like | high | 9 | 100% | 16.08 | [14.91, 17.15] | n/a | 3545 | - |
| laya:cumulative:auto:top3:x3 | tokyo-like | high | 9 | 100% | 13.10 | [11.09, 15.08] | n/a | 1889 | - |
| laya:cumulative:auto:top3:x3 | nyc-like | high | 9 | 100% | 32.10 | [28.77, 35.31] | n/a | 1720 | - |

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
| random-reference:top8 | sf-like | low | 9 | 9 | 0 | 0 | -50.46 | [-63.59, -36.22] | -1385.4 | 0/9 |
| random-reference:top8 | sf-like | medium | 9 | 9 | 0 | 0 | -48.28 | [-57.44, -40.00] | -703.6 | 0/9 |
| random-reference:top8 | sf-like | high | 9 | 9 | 0 | 0 | -53.84 | [-65.12, -43.33] | -522.3 | 0/9 |
| random-reference:top8 | tokyo-like | low | 9 | 9 | 0 | 0 | -25.94 | [-32.99, -18.54] | -1347.3 | 0/9 |
| random-reference:top8 | tokyo-like | medium | 9 | 9 | 0 | 0 | -46.00 | [-61.10, -33.49] | -998.7 | 0/9 |
| random-reference:top8 | tokyo-like | high | 9 | 9 | 0 | 0 | -31.40 | [-42.65, -22.90] | -405.7 | 0/9 |
| random-reference:top8 | nyc-like | low | 9 | 9 | 0 | 0 | -74.36 | [-99.64, -55.03] | -1463.9 | 0/9 |
| random-reference:top8 | nyc-like | medium | 9 | 9 | 0 | 0 | -99.00 | [-108.57, -89.80] | -673.7 | 0/9 |
| random-reference:top8 | nyc-like | high | 9 | 9 | 0 | 0 | -110.67 | [-139.76, -86.39] | -541.3 | 0/9 |
| claude:claude-opus-5:low:cumulative:auto:top8 | sf-like | low | 9 | 9 | 0 | 0 | -0.30 | [-0.66, 0.10] | -6.4 | 3/9 |
| claude:claude-opus-5:low:cumulative:auto:top8 | tokyo-like | low | 9 | 9 | 0 | 0 | -0.18 | [-0.38, 0.02] | -9.0 | 3/9 |
| claude:claude-opus-5:low:cumulative:auto:top8 | nyc-like | low | 9 | 9 | 0 | 0 | 0.09 | [-1.03, 1.04] | -2.3 | 3/9 |
| claude:claude-opus-5:low:cumulative:auto:top8 | sf-like | medium | 9 | 9 | 0 | 0 | -1.51 | [-2.49, -0.72] | -17.6 | 0/9 |
| claude:claude-opus-5:low:cumulative:auto:top8 | tokyo-like | medium | 9 | 9 | 0 | 0 | -2.58 | [-5.29, 0.09] | -35.8 | 6/9 |
| claude:claude-opus-5:low:cumulative:auto:top8 | nyc-like | medium | 9 | 9 | 0 | 0 | 1.32 | [0.44, 2.27] | 10.1 | 6/9 |
| claude:claude-opus-5:low:cumulative:auto:top8 | sf-like | high | 9 | 9 | 0 | 0 | -0.39 | [-2.55, 1.90] | -7.7 | 3/9 |
| claude:claude-opus-5:low:cumulative:auto:top8 | tokyo-like | high | 9 | 9 | 0 | 0 | -0.21 | [-0.82, 0.32] | -3.4 | 5/9 |
| claude:claude-opus-5:low:cumulative:auto:top8 | nyc-like | high | 9 | 9 | 0 | 0 | -3.26 | [-6.14, -0.84] | -15.7 | 1/9 |
| claude:claude-opus-5:low:forecast:auto:top8 | sf-like | low | 9 | 9 | 0 | 0 | -0.08 | [-0.30, 0.13] | -1.0 | 3/9 |
| claude:claude-opus-5:low:forecast:auto:top8 | tokyo-like | low | 9 | 9 | 0 | 0 | -0.21 | [-0.42, -0.01] | -10.3 | 3/9 |
| claude:claude-opus-5:low:forecast:auto:top8 | nyc-like | low | 9 | 9 | 0 | 0 | 0.14 | [-0.58, 0.95] | -4.5 | 3/9 |
| claude:claude-opus-5:low:forecast:auto:top8 | sf-like | medium | 9 | 9 | 0 | 0 | -0.89 | [-1.63, -0.35] | -9.4 | 0/9 |
| claude:claude-opus-5:low:forecast:auto:top8 | tokyo-like | medium | 9 | 9 | 0 | 0 | -0.71 | [-1.75, 0.10] | -7.7 | 6/9 |
| claude:claude-opus-5:low:forecast:auto:top8 | nyc-like | medium | 9 | 9 | 0 | 0 | -2.30 | [-5.50, 0.42] | -11.3 | 6/9 |
| claude:claude-opus-5:low:forecast:auto:top8 | sf-like | high | 9 | 9 | 0 | 0 | 0.04 | [-2.81, 2.87] | -2.1 | 4/9 |
| claude:claude-opus-5:low:forecast:auto:top8 | tokyo-like | high | 9 | 9 | 0 | 0 | -1.27 | [-2.10, -0.47] | -14.0 | 2/9 |
| claude:claude-opus-5:low:forecast:auto:top8 | nyc-like | high | 9 | 9 | 0 | 0 | -3.98 | [-7.70, -0.72] | -19.7 | 1/9 |
| openai:gpt-5.6-sol:low:cumulative:auto:top8 | sf-like | low | 9 | 9 | 0 | 0 | -0.11 | [-0.53, 0.24] | -0.7 | 5/9 |
| openai:gpt-5.6-sol:low:cumulative:auto:top8 | tokyo-like | low | 9 | 9 | 0 | 0 | -0.02 | [-0.10, 0.07] | -0.6 | 3/9 |
| openai:gpt-5.6-sol:low:cumulative:auto:top8 | nyc-like | low | 9 | 9 | 0 | 0 | 0.12 | [-1.08, 1.45] | -5.4 | 3/9 |
| openai:gpt-5.6-sol:low:cumulative:auto:top8 | sf-like | medium | 9 | 9 | 0 | 0 | -2.10 | [-3.41, -1.01] | -23.9 | 0/9 |
| openai:gpt-5.6-sol:low:cumulative:auto:top8 | tokyo-like | medium | 9 | 9 | 0 | 0 | -1.44 | [-3.12, -0.10] | -19.3 | 3/9 |
| openai:gpt-5.6-sol:low:cumulative:auto:top8 | nyc-like | medium | 9 | 9 | 0 | 0 | -2.95 | [-6.22, -0.60] | -18.2 | 1/9 |
| openai:gpt-5.6-sol:low:cumulative:auto:top8 | sf-like | high | 9 | 9 | 0 | 0 | -0.28 | [-2.33, 1.71] | -3.3 | 4/9 |
| openai:gpt-5.6-sol:low:cumulative:auto:top8 | tokyo-like | high | 9 | 9 | 0 | 0 | -2.00 | [-3.37, -1.04] | -24.8 | 0/9 |
| openai:gpt-5.6-sol:low:cumulative:auto:top8 | nyc-like | high | 9 | 9 | 0 | 0 | -3.10 | [-5.76, -0.70] | -14.4 | 3/9 |
| openai:gpt-5.6-sol:low:forecast:auto:top8 | sf-like | low | 9 | 9 | 0 | 0 | -0.20 | [-0.61, 0.14] | -3.6 | 3/9 |
| openai:gpt-5.6-sol:low:forecast:auto:top8 | tokyo-like | low | 9 | 9 | 0 | 0 | -0.24 | [-0.46, -0.01] | -11.8 | 1/9 |
| openai:gpt-5.6-sol:low:forecast:auto:top8 | nyc-like | low | 9 | 9 | 0 | 0 | 0.37 | [-0.83, 1.60] | -0.6 | 5/9 |
| openai:gpt-5.6-sol:low:forecast:auto:top8 | sf-like | medium | 9 | 9 | 0 | 0 | -0.94 | [-2.31, -0.02] | -11.2 | 1/9 |
| openai:gpt-5.6-sol:low:forecast:auto:top8 | tokyo-like | medium | 9 | 9 | 0 | 0 | -0.99 | [-2.07, -0.04] | -13.4 | 3/9 |
| openai:gpt-5.6-sol:low:forecast:auto:top8 | nyc-like | medium | 9 | 9 | 0 | 0 | 0.24 | [-0.82, 1.05] | 2.9 | 5/9 |
| openai:gpt-5.6-sol:low:forecast:auto:top8 | sf-like | high | 9 | 9 | 0 | 0 | 0.43 | [-1.94, 2.72] | -0.2 | 3/9 |
| openai:gpt-5.6-sol:low:forecast:auto:top8 | tokyo-like | high | 9 | 9 | 0 | 0 | -1.13 | [-2.46, 0.15] | -11.2 | 4/9 |
| openai:gpt-5.6-sol:low:forecast:auto:top8 | nyc-like | high | 9 | 9 | 0 | 0 | -4.03 | [-7.00, -1.58] | -20.5 | 2/9 |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | sf-like | low | 9 | 9 | 0 | 0 | -0.04 | [-0.47, 0.38] | 1.5 | 6/9 |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | tokyo-like | low | 9 | 9 | 0 | 0 | -0.24 | [-0.40, -0.09] | -11.9 | 3/9 |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | nyc-like | low | 9 | 9 | 0 | 0 | 0.21 | [-1.07, 1.58] | -4.6 | 3/9 |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | sf-like | medium | 9 | 9 | 0 | 0 | -2.08 | [-4.31, 0.00] | -19.5 | 4/9 |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | tokyo-like | medium | 9 | 9 | 0 | 0 | -0.51 | [-1.54, 0.43] | -3.7 | 6/9 |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | nyc-like | medium | 9 | 9 | 0 | 0 | -0.01 | [-1.37, 1.22] | 2.6 | 5/9 |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | sf-like | high | 9 | 9 | 0 | 0 | -0.86 | [-2.01, 0.52] | -7.0 | 2/9 |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | tokyo-like | high | 9 | 9 | 0 | 0 | -2.21 | [-3.48, -0.99] | -27.1 | 2/9 |
| gemini:gemini-3.8-flash:low:cumulative:auto:top8 | nyc-like | high | 9 | 9 | 0 | 0 | -3.03 | [-5.97, -0.77] | -14.3 | 4/9 |
| gemini:gemini-3.8-flash:low:forecast:auto:top8 | sf-like | low | 9 | 9 | 0 | 0 | -0.06 | [-0.30, 0.16] | -0.3 | 3/9 |
| gemini:gemini-3.8-flash:low:forecast:auto:top8 | tokyo-like | low | 9 | 9 | 0 | 0 | -0.08 | [-0.36, 0.21] | -3.0 | 3/9 |
| gemini:gemini-3.8-flash:low:forecast:auto:top8 | nyc-like | low | 9 | 9 | 0 | 0 | 0.61 | [-0.43, 1.73] | 1.9 | 3/9 |
| gemini:gemini-3.8-flash:low:forecast:auto:top8 | sf-like | medium | 9 | 9 | 0 | 0 | -1.50 | [-2.25, -0.80] | -18.1 | 0/9 |
| gemini:gemini-3.8-flash:low:forecast:auto:top8 | tokyo-like | medium | 9 | 9 | 0 | 0 | -0.65 | [-1.49, 0.09] | -8.6 | 5/9 |
| gemini:gemini-3.8-flash:low:forecast:auto:top8 | nyc-like | medium | 9 | 9 | 0 | 0 | -0.05 | [-0.33, 0.15] | 0.0 | 3/9 |
| gemini:gemini-3.8-flash:low:forecast:auto:top8 | sf-like | high | 9 | 9 | 0 | 0 | -0.29 | [-2.35, 1.94] | -4.8 | 3/9 |
| gemini:gemini-3.8-flash:low:forecast:auto:top8 | tokyo-like | high | 9 | 9 | 0 | 0 | -1.07 | [-2.10, -0.04] | -11.2 | 3/9 |
| gemini:gemini-3.8-flash:low:forecast:auto:top8 | nyc-like | high | 9 | 9 | 0 | 0 | -4.60 | [-7.55, -1.44] | -24.3 | 2/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | sf-like | low | 9 | 9 | 0 | 0 | -0.23 | [-0.67, 0.16] | -4.1 | 4/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | tokyo-like | low | 9 | 9 | 0 | 0 | -0.48 | [-0.57, -0.40] | -24.9 | 0/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | nyc-like | low | 9 | 9 | 0 | 0 | 0.09 | [-1.08, 1.31] | -6.4 | 3/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | sf-like | medium | 9 | 9 | 0 | 0 | -2.09 | [-3.38, -0.95] | -27.1 | 0/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | tokyo-like | medium | 9 | 9 | 0 | 0 | -2.41 | [-4.51, -0.68] | -36.1 | 3/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | nyc-like | medium | 9 | 9 | 0 | 0 | -2.97 | [-6.63, 0.17] | -12.4 | 4/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | sf-like | high | 9 | 9 | 0 | 0 | -2.20 | [-3.92, -0.14] | -23.2 | 2/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | tokyo-like | high | 9 | 9 | 0 | 0 | -1.90 | [-2.55, -1.32] | -24.2 | 0/9 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | nyc-like | high | 9 | 9 | 0 | 0 | -7.31 | [-9.82, -5.21] | -35.8 | 0/9 |
| jev:jev-1.13.0:forecast:auto:top8:x1 | sf-like | low | 9 | 9 | 0 | 0 | 0.11 | [-0.19, 0.35] | 4.6 | 7/9 |
| jev:jev-1.13.0:forecast:auto:top8:x1 | tokyo-like | low | 9 | 9 | 0 | 0 | -0.43 | [-0.55, -0.32] | -21.7 | 0/9 |
| jev:jev-1.13.0:forecast:auto:top8:x1 | nyc-like | low | 9 | 9 | 0 | 0 | 0.07 | [-0.79, 0.97] | -4.1 | 4/9 |
| jev:jev-1.13.0:forecast:auto:top8:x1 | sf-like | medium | 9 | 9 | 0 | 0 | -1.88 | [-3.83, -0.55] | -20.6 | 1/9 |
| jev:jev-1.13.0:forecast:auto:top8:x1 | tokyo-like | medium | 9 | 9 | 0 | 0 | -1.60 | [-2.88, -0.58] | -24.8 | 0/9 |
| jev:jev-1.13.0:forecast:auto:top8:x1 | nyc-like | medium | 9 | 9 | 0 | 0 | -2.67 | [-4.57, -0.60] | -13.8 | 2/9 |
| jev:jev-1.13.0:forecast:auto:top8:x1 | sf-like | high | 9 | 9 | 0 | 0 | -1.02 | [-2.06, 0.14] | -10.0 | 2/9 |
| jev:jev-1.13.0:forecast:auto:top8:x1 | tokyo-like | high | 9 | 9 | 0 | 0 | -2.47 | [-4.28, -0.88] | -28.1 | 0/9 |
| jev:jev-1.13.0:forecast:auto:top8:x1 | nyc-like | high | 9 | 9 | 0 | 0 | -1.58 | [-3.06, -0.37] | -6.7 | 2/9 |
| laya:cumulative:auto:top3:x3 | sf-like | low | 9 | 9 | 0 | 0 | -2.12 | [-3.02, -1.18] | -56.0 | 0/9 |
| laya:cumulative:auto:top3:x3 | tokyo-like | low | 9 | 9 | 0 | 0 | -1.69 | [-2.41, -1.00] | -89.6 | 0/9 |
| laya:cumulative:auto:top3:x3 | nyc-like | low | 9 | 9 | 0 | 0 | -3.78 | [-4.53, -2.76] | -83.2 | 0/9 |
| laya:cumulative:auto:top3:x3 | sf-like | medium | 9 | 9 | 0 | 0 | -5.14 | [-6.26, -4.16] | -70.1 | 0/9 |
| laya:cumulative:auto:top3:x3 | tokyo-like | medium | 9 | 9 | 0 | 0 | -4.64 | [-5.77, -3.89] | -94.6 | 0/9 |
| laya:cumulative:auto:top3:x3 | nyc-like | medium | 9 | 9 | 0 | 0 | -5.59 | [-8.50, -3.02] | -30.8 | 0/9 |
| laya:cumulative:auto:top3:x3 | sf-like | high | 9 | 9 | 0 | 0 | -3.46 | [-5.35, -1.63] | -45.0 | 0/9 |
| laya:cumulative:auto:top3:x3 | tokyo-like | high | 9 | 9 | 0 | 0 | -5.52 | [-6.50, -4.53] | -71.8 | 0/9 |
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
| rollout-reference:known:k8:s64:h10 | low | 3 | 100% | 3.28 |
| rollout-reference:known:k8:s64:h10 | medium | 3 | 100% | 8.35 |
| rollout-reference:known:k8:s64:h10 | high | 3 | 100% | 11.37 |
| random-reference:top8 | low | 3 | 100% | 54.04 |
| random-reference:top8 | medium | 3 | 100% | 73.82 |
| random-reference:top8 | high | 3 | 100% | 78.90 |
| claude:claude-opus-5:low:cumulative:auto:top8 | low | 3 | 100% | 3.92 |
| claude:claude-opus-5:low:cumulative:auto:top8 | medium | 3 | 100% | 10.32 |
| claude:claude-opus-5:low:cumulative:auto:top8 | high | 3 | 100% | 14.88 |
| claude:claude-opus-5:low:forecast:auto:top8 | low | 3 | 100% | 3.84 |
| claude:claude-opus-5:low:forecast:auto:top8 | medium | 3 | 100% | 10.70 |
| claude:claude-opus-5:low:forecast:auto:top8 | high | 3 | 100% | 15.34 |
| openai:gpt-5.6-sol:low:cumulative:auto:top8 | low | 3 | 100% | 3.79 |
| openai:gpt-5.6-sol:low:cumulative:auto:top8 | medium | 3 | 100% | 11.56 |
| openai:gpt-5.6-sol:low:cumulative:auto:top8 | high | 3 | 100% | 15.39 |
| openai:gpt-5.6-sol:low:forecast:auto:top8 | low | 3 | 100% | 3.81 |
| openai:gpt-5.6-sol:low:forecast:auto:top8 | medium | 3 | 100% | 9.96 |
| openai:gpt-5.6-sol:low:forecast:auto:top8 | high | 3 | 100% | 15.17 |
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
| laya:cumulative:auto:top3:x3 | low | 3 | 100% | 6.31 |
| laya:cumulative:auto:top3:x3 | medium | 3 | 100% | 14.52 |
| laya:cumulative:auto:top3:x3 | high | 3 | 100% | 20.43 |
