# Benchmark analysis: synthetic-dev/1

Manifest sha256:58fdffbe7e405dfdde4b9d3dbb476806ecc213d0d8f96efc391046a6c282c994. Reference policy: swift-insertion-reference. Bootstrap seed 1, 95% percentile intervals over scenarios.

## Per cell (policy x city x load)

Pain is reported over complete runs only; read it together with the success rate.

| policy | city | load | runs | success | pain (complete only) | 95% CI | mean cost (USD) | latency p50 (ms) | failures |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| fixture-append-earliest-pickup | sf-like | low | 3 | 100% | 12.61 | [3.40, 26.93] | n/a | 0 | - |
| swift-insertion-reference | sf-like | low | 3 | 100% | 4.04 | [3.37, 4.53] | n/a | 0 | - |
| swift-insertion-reference | sf-like | medium | 3 | 100% | 9.98 | [5.10, 18.39] | n/a | 1 | - |
| fixture-append-earliest-pickup | sf-like | medium | 3 | 100% | 120.99 | [10.01, 264.16] | n/a | 0 | - |
| fixture-append-earliest-pickup | sf-like | high | 3 | 100% | 683.63 | [181.45, 1210.43] | n/a | 0 | - |
| swift-insertion-reference | sf-like | high | 3 | 100% | 33.80 | [8.84, 71.13] | n/a | 2 | - |
| swift-insertion-reference | tokyo-like | low | 3 | 100% | 2.14 | [1.81, 2.52] | n/a | 0 | - |
| fixture-append-earliest-pickup | tokyo-like | low | 3 | 100% | 3.84 | [2.37, 6.73] | n/a | 0 | - |
| fixture-append-earliest-pickup | tokyo-like | medium | 3 | 100% | 92.58 | [4.86, 242.08] | n/a | 0 | - |
| swift-insertion-reference | tokyo-like | medium | 3 | 100% | 7.29 | [3.23, 14.08] | n/a | 0 | - |
| swift-insertion-reference | tokyo-like | high | 3 | 100% | 25.58 | [7.57, 58.63] | n/a | 1 | - |
| fixture-append-earliest-pickup | tokyo-like | high | 3 | 100% | 542.71 | [327.04, 849.33] | n/a | 0 | - |
| fixture-append-earliest-pickup | nyc-like | low | 3 | 100% | 30.89 | [4.95, 79.68] | n/a | 0 | - |
| swift-insertion-reference | nyc-like | low | 3 | 100% | 5.71 | [3.22, 7.63] | n/a | 0 | - |
| swift-insertion-reference | nyc-like | medium | 3 | 100% | 19.48 | [10.22, 28.11] | n/a | 1 | - |
| fixture-append-earliest-pickup | nyc-like | medium | 3 | 100% | 210.84 | [20.33, 344.03] | n/a | 0 | - |
| fixture-append-earliest-pickup | nyc-like | high | 3 | 100% | 911.93 | [537.08, 1221.37] | n/a | 0 | - |
| swift-insertion-reference | nyc-like | high | 3 | 100% | 43.23 | [18.35, 67.80] | n/a | 2 | - |

## Paired against the reference

Diff is reference pain minus policy pain on the same scenario and repetition; positive favours the policy. Improvement % uses the reference pain as denominator and is omitted when it is 0.

| policy | city | load | pairs | both complete | only ref | only policy | mean diff (ref - policy) | 95% CI | mean improvement % | policy wins |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| fixture-append-earliest-pickup | sf-like | low | 3 | 3 | 0 | 0 | -8.58 | [-22.71, -0.02] | -202.0 | 0/3 |
| fixture-append-earliest-pickup | sf-like | medium | 3 | 3 | 0 | 0 | -111.02 | [-245.77, -4.91] | -903.9 | 0/3 |
| fixture-append-earliest-pickup | sf-like | high | 3 | 3 | 0 | 0 | -649.83 | [-1139.30, -172.61] | -2176.8 | 0/3 |
| fixture-append-earliest-pickup | tokyo-like | low | 3 | 3 | 0 | 0 | -1.70 | [-4.21, -0.27] | -71.3 | 0/3 |
| fixture-append-earliest-pickup | tokyo-like | medium | 3 | 3 | 0 | 0 | -85.29 | [-227.99, -1.63] | -748.5 | 0/3 |
| fixture-append-earliest-pickup | tokyo-like | high | 3 | 3 | 0 | 0 | -517.13 | [-790.70, -319.48] | -3253.3 | 0/3 |
| fixture-append-earliest-pickup | nyc-like | low | 3 | 3 | 0 | 0 | -25.19 | [-72.05, -1.73] | -342.0 | 0/3 |
| fixture-append-earliest-pickup | nyc-like | medium | 3 | 3 | 0 | 0 | -191.37 | [-315.92, -10.11] | -819.1 | 0/3 |
| fixture-append-earliest-pickup | nyc-like | high | 3 | 3 | 0 | 0 | -868.70 | [-1153.57, -518.72] | -2224.2 | 0/3 |

## Across cities (equal weight per city)

Each city contributes equally regardless of its request count.

| policy | load | cities | success (equal-weight) | pain (equal-weight, complete only) |
| --- | --- | --- | --- | --- |
| fixture-append-earliest-pickup | low | 3 | 100% | 15.78 |
| swift-insertion-reference | low | 3 | 100% | 3.96 |
| swift-insertion-reference | medium | 3 | 100% | 12.25 |
| fixture-append-earliest-pickup | medium | 3 | 100% | 141.47 |
| fixture-append-earliest-pickup | high | 3 | 100% | 712.76 |
| swift-insertion-reference | high | 3 | 100% | 34.20 |
