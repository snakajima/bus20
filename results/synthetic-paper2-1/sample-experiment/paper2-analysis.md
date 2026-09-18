# Second-paper analysis: paper2-sample-1

Suite synthetic-paper2/1. Generator: sample / sample-ladder/1. **The sample generator is an offline stand-in, not a model; these numbers exercise the pipeline only.**

## Modes at equal budget

Development pain is the incumbent's conditional mean at the end of the campaign; test pain is the selected program's, over complete runs only.

| mode | campaigns | selected | generations | evaluations | cost (USD) | program CPU (ms) | dev pain | test success | test pain |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| B0 | 2 | 2 | 1.0 | 2.0 | 0.0000 | 77 | 4986.15 | 33% | 4310.93 |
| B-restart | 2 | 2 | 3.0 | 6.0 | 0.0000 | 180 | 29.60 | 100% | 10.28 |
| B-self | 2 | 2 | 3.0 | 6.0 | 0.0000 | 175 | 5.26 | 100% | 10.28 |

## Improvement curves

One row per iteration: cumulative spend against the best accepted development pain so far.

| campaign | iteration | accepted | generations | evaluations | cost (USD) | iteration dev pain | incumbent dev pain | incumbent success |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| B0-1 | 0 | yes | 1 | 1 | 0.0000 | 4986.15 | 4986.15 | 17% |
| B0-2 | 0 | yes | 1 | 1 | 0.0000 | 4986.15 | 4986.15 | 17% |
| B-restart-1 | 0 | yes | 1 | 1 | 0.0000 | 4986.15 | 4986.15 | 17% |
| B-restart-1 | 1 | yes | 2 | 2 | 0.0000 | 5.26 | 5.26 | 100% |
| B-restart-1 | 2 | yes | 3 | 3 | 0.0000 | 53.94 | 53.94 | 100% |
| B-restart-2 | 0 | yes | 1 | 1 | 0.0000 | 4986.15 | 4986.15 | 17% |
| B-restart-2 | 1 | yes | 2 | 2 | 0.0000 | 5.26 | 5.26 | 100% |
| B-restart-2 | 2 | yes | 3 | 3 | 0.0000 | 5.26 | 5.26 | 100% |
| B-self-1 | 0 | yes | 1 | 1 | 0.0000 | 4986.15 | 4986.15 | 17% |
| B-self-1 | 1 | yes | 2 | 2 | 0.0000 | 53.94 | 53.94 | 100% |
| B-self-1 | 2 | yes | 3 | 3 | 0.0000 | 5.26 | 5.26 | 100% |
| B-self-2 | 0 | yes | 1 | 1 | 0.0000 | 4986.15 | 4986.15 | 17% |
| B-self-2 | 1 | yes | 2 | 2 | 0.0000 | 53.94 | 53.94 | 100% |
| B-self-2 | 2 | yes | 3 | 3 | 0.0000 | 5.26 | 5.26 | 100% |

## Test split: programs and references

Pain is over complete runs only; read it with the success rate.

| policy | city | load | runs | success | pain (complete only) | 95% CI |
| --- | --- | --- | --- | --- | --- | --- |
| fixture-append-earliest-pickup | sf-like | low | 2 | 100% | 3.20 | [2.34, 4.06] |
| fixture-append-earliest-pickup | sf-like | medium | 2 | 100% | 37.62 | [14.65, 60.59] |
| fixture-append-earliest-pickup | sf-like | high | 2 | 100% | 363.07 | [170.10, 556.04] |
| fixture-append-earliest-pickup | tokyo-like | low | 2 | 100% | 23.73 | [12.57, 34.90] |
| fixture-append-earliest-pickup | tokyo-like | medium | 2 | 100% | 92.05 | [33.30, 150.80] |
| fixture-append-earliest-pickup | tokyo-like | high | 2 | 100% | 756.22 | [333.12, 1179.31] |
| fixture-append-earliest-pickup | nyc-like | low | 2 | 100% | 5.80 | [4.98, 6.61] |
| fixture-append-earliest-pickup | nyc-like | medium | 2 | 100% | 64.79 | [13.40, 116.18] |
| fixture-append-earliest-pickup | nyc-like | high | 2 | 100% | 432.77 | [429.24, 436.31] |
| swift-insertion-reference | sf-like | low | 2 | 100% | 2.40 | [2.23, 2.57] |
| swift-insertion-reference | sf-like | medium | 2 | 100% | 6.74 | [6.31, 7.16] |
| swift-insertion-reference | sf-like | high | 2 | 100% | 13.40 | [11.90, 14.90] |
| swift-insertion-reference | tokyo-like | low | 2 | 100% | 9.91 | [7.82, 12.00] |
| swift-insertion-reference | tokyo-like | medium | 2 | 100% | 9.27 | [7.59, 10.96] |
| swift-insertion-reference | tokyo-like | high | 2 | 100% | 12.45 | [8.42, 16.48] |
| swift-insertion-reference | nyc-like | low | 2 | 100% | 4.76 | [4.49, 5.03] |
| swift-insertion-reference | nyc-like | medium | 2 | 100% | 13.37 | [7.13, 19.60] |
| swift-insertion-reference | nyc-like | high | 2 | 100% | 20.19 | [16.24, 24.15] |
| B0#1 | sf-like | low | 2 | 100% | 3782.32 | [3279.44, 4285.19] |
| B0#1 | sf-like | medium | 2 | 0% | n/a | n/a |
| B0#1 | sf-like | high | 2 | 0% | n/a | n/a |
| B0#1 | tokyo-like | low | 2 | 100% | 4906.40 | [3578.25, 6234.55] |
| B0#1 | tokyo-like | medium | 2 | 0% | n/a | n/a |
| B0#1 | tokyo-like | high | 2 | 0% | n/a | n/a |
| B0#1 | nyc-like | low | 2 | 100% | 4244.06 | [3572.38, 4915.74] |
| B0#1 | nyc-like | medium | 2 | 0% | n/a | n/a |
| B0#1 | nyc-like | high | 2 | 0% | n/a | n/a |
| B0#2 | sf-like | low | 2 | 100% | 3782.32 | [3279.44, 4285.19] |
| B0#2 | sf-like | medium | 2 | 0% | n/a | n/a |
| B0#2 | sf-like | high | 2 | 0% | n/a | n/a |
| B0#2 | tokyo-like | low | 2 | 100% | 4906.40 | [3578.25, 6234.55] |
| B0#2 | tokyo-like | medium | 2 | 0% | n/a | n/a |
| B0#2 | tokyo-like | high | 2 | 0% | n/a | n/a |
| B0#2 | nyc-like | low | 2 | 100% | 4244.06 | [3572.38, 4915.74] |
| B0#2 | nyc-like | medium | 2 | 0% | n/a | n/a |
| B0#2 | nyc-like | high | 2 | 0% | n/a | n/a |
| B-restart#1 | sf-like | low | 2 | 100% | 2.40 | [2.23, 2.57] |
| B-restart#1 | sf-like | medium | 2 | 100% | 6.74 | [6.31, 7.16] |
| B-restart#1 | sf-like | high | 2 | 100% | 13.40 | [11.90, 14.90] |
| B-restart#1 | tokyo-like | low | 2 | 100% | 9.91 | [7.82, 12.00] |
| B-restart#1 | tokyo-like | medium | 2 | 100% | 9.27 | [7.59, 10.96] |
| B-restart#1 | tokyo-like | high | 2 | 100% | 12.45 | [8.42, 16.48] |
| B-restart#1 | nyc-like | low | 2 | 100% | 4.76 | [4.49, 5.03] |
| B-restart#1 | nyc-like | medium | 2 | 100% | 13.37 | [7.13, 19.60] |
| B-restart#1 | nyc-like | high | 2 | 100% | 20.19 | [16.24, 24.15] |
| B-restart#2 | sf-like | low | 2 | 100% | 2.40 | [2.23, 2.57] |
| B-restart#2 | sf-like | medium | 2 | 100% | 6.74 | [6.31, 7.16] |
| B-restart#2 | sf-like | high | 2 | 100% | 13.40 | [11.90, 14.90] |
| B-restart#2 | tokyo-like | low | 2 | 100% | 9.91 | [7.82, 12.00] |
| B-restart#2 | tokyo-like | medium | 2 | 100% | 9.27 | [7.59, 10.96] |
| B-restart#2 | tokyo-like | high | 2 | 100% | 12.45 | [8.42, 16.48] |
| B-restart#2 | nyc-like | low | 2 | 100% | 4.76 | [4.49, 5.03] |
| B-restart#2 | nyc-like | medium | 2 | 100% | 13.37 | [7.13, 19.60] |
| B-restart#2 | nyc-like | high | 2 | 100% | 20.19 | [16.24, 24.15] |
| B-self#1 | sf-like | low | 2 | 100% | 2.40 | [2.23, 2.57] |
| B-self#1 | sf-like | medium | 2 | 100% | 6.74 | [6.31, 7.16] |
| B-self#1 | sf-like | high | 2 | 100% | 13.40 | [11.90, 14.90] |
| B-self#1 | tokyo-like | low | 2 | 100% | 9.91 | [7.82, 12.00] |
| B-self#1 | tokyo-like | medium | 2 | 100% | 9.27 | [7.59, 10.96] |
| B-self#1 | tokyo-like | high | 2 | 100% | 12.45 | [8.42, 16.48] |
| B-self#1 | nyc-like | low | 2 | 100% | 4.76 | [4.49, 5.03] |
| B-self#1 | nyc-like | medium | 2 | 100% | 13.37 | [7.13, 19.60] |
| B-self#1 | nyc-like | high | 2 | 100% | 20.19 | [16.24, 24.15] |
| B-self#2 | sf-like | low | 2 | 100% | 2.40 | [2.23, 2.57] |
| B-self#2 | sf-like | medium | 2 | 100% | 6.74 | [6.31, 7.16] |
| B-self#2 | sf-like | high | 2 | 100% | 13.40 | [11.90, 14.90] |
| B-self#2 | tokyo-like | low | 2 | 100% | 9.91 | [7.82, 12.00] |
| B-self#2 | tokyo-like | medium | 2 | 100% | 9.27 | [7.59, 10.96] |
| B-self#2 | tokyo-like | high | 2 | 100% | 12.45 | [8.42, 16.48] |
| B-self#2 | nyc-like | low | 2 | 100% | 4.76 | [4.49, 5.03] |
| B-self#2 | nyc-like | medium | 2 | 100% | 13.37 | [7.13, 19.60] |
| B-self#2 | nyc-like | high | 2 | 100% | 20.19 | [16.24, 24.15] |

## Paired against swift-insertion-reference on the test split

Diff is reference pain minus policy pain on the same scenario; positive favours the policy.

| policy | city | load | pairs | both complete | mean diff | 95% CI | improvement % | wins |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| fixture-append-earliest-pickup | sf-like | low | 2 | 2 | -0.80 | [-1.49, -0.11] | -31.5 | 0/2 |
| fixture-append-earliest-pickup | sf-like | medium | 2 | 2 | -30.88 | [-53.42, -8.34] | -438.9 | 0/2 |
| fixture-append-earliest-pickup | sf-like | high | 2 | 2 | -349.67 | [-541.14, -158.20] | -2480.7 | 0/2 |
| fixture-append-earliest-pickup | tokyo-like | low | 2 | 2 | -13.82 | [-27.08, -0.57] | -175.5 | 0/2 |
| fixture-append-earliest-pickup | tokyo-like | medium | 2 | 2 | -82.78 | [-139.84, -25.71] | -807.2 | 0/2 |
| fixture-append-earliest-pickup | tokyo-like | high | 2 | 2 | -743.77 | [-1162.83, -324.70] | -5455.3 | 0/2 |
| fixture-append-earliest-pickup | nyc-like | low | 2 | 2 | -1.04 | [-1.58, -0.49] | -21.2 | 0/2 |
| fixture-append-earliest-pickup | nyc-like | medium | 2 | 2 | -51.43 | [-96.58, -6.27] | -290.4 | 0/2 |
| fixture-append-earliest-pickup | nyc-like | high | 2 | 2 | -412.58 | [-420.07, -405.09] | -2132.3 | 0/2 |
| B0#1 | sf-like | low | 2 | 2 | -3779.92 | [-4282.96, -3276.87] | -159759.0 | 0/2 |
| B0#1 | sf-like | medium | 2 | 0 | n/a | n/a | n/a | 0/0 |
| B0#1 | sf-like | high | 2 | 0 | n/a | n/a | n/a | 0/0 |
| B0#1 | tokyo-like | low | 2 | 2 | -4896.49 | [-6226.73, -3566.25] | -54675.5 | 0/2 |
| B0#1 | tokyo-like | medium | 2 | 0 | n/a | n/a | n/a | 0/0 |
| B0#1 | tokyo-like | high | 2 | 0 | n/a | n/a | n/a | 0/0 |
| B0#1 | nyc-like | low | 2 | 2 | -4239.30 | [-4910.71, -3567.89] | -88517.8 | 0/2 |
| B0#1 | nyc-like | medium | 2 | 0 | n/a | n/a | n/a | 0/0 |
| B0#1 | nyc-like | high | 2 | 0 | n/a | n/a | n/a | 0/0 |
| B0#2 | sf-like | low | 2 | 2 | -3779.92 | [-4282.96, -3276.87] | -159759.0 | 0/2 |
| B0#2 | sf-like | medium | 2 | 0 | n/a | n/a | n/a | 0/0 |
| B0#2 | sf-like | high | 2 | 0 | n/a | n/a | n/a | 0/0 |
| B0#2 | tokyo-like | low | 2 | 2 | -4896.49 | [-6226.73, -3566.25] | -54675.5 | 0/2 |
| B0#2 | tokyo-like | medium | 2 | 0 | n/a | n/a | n/a | 0/0 |
| B0#2 | tokyo-like | high | 2 | 0 | n/a | n/a | n/a | 0/0 |
| B0#2 | nyc-like | low | 2 | 2 | -4239.30 | [-4910.71, -3567.89] | -88517.8 | 0/2 |
| B0#2 | nyc-like | medium | 2 | 0 | n/a | n/a | n/a | 0/0 |
| B0#2 | nyc-like | high | 2 | 0 | n/a | n/a | n/a | 0/0 |
| B-restart#1 | sf-like | low | 2 | 2 | 0.00 | [0.00, 0.00] | 0.0 | 0/2 |
| B-restart#1 | sf-like | medium | 2 | 2 | 0.00 | [0.00, 0.00] | 0.0 | 0/2 |
| B-restart#1 | sf-like | high | 2 | 2 | 0.00 | [0.00, 0.00] | 0.0 | 0/2 |
| B-restart#1 | tokyo-like | low | 2 | 2 | 0.00 | [0.00, 0.00] | 0.0 | 0/2 |
| B-restart#1 | tokyo-like | medium | 2 | 2 | 0.00 | [0.00, 0.00] | 0.0 | 0/2 |
| B-restart#1 | tokyo-like | high | 2 | 2 | 0.00 | [0.00, 0.00] | 0.0 | 0/2 |
| B-restart#1 | nyc-like | low | 2 | 2 | 0.00 | [0.00, 0.00] | 0.0 | 0/2 |
| B-restart#1 | nyc-like | medium | 2 | 2 | 0.00 | [0.00, 0.00] | 0.0 | 0/2 |
| B-restart#1 | nyc-like | high | 2 | 2 | 0.00 | [0.00, 0.00] | 0.0 | 0/2 |
| B-restart#2 | sf-like | low | 2 | 2 | 0.00 | [0.00, 0.00] | 0.0 | 0/2 |
| B-restart#2 | sf-like | medium | 2 | 2 | 0.00 | [0.00, 0.00] | 0.0 | 0/2 |
| B-restart#2 | sf-like | high | 2 | 2 | 0.00 | [0.00, 0.00] | 0.0 | 0/2 |
| B-restart#2 | tokyo-like | low | 2 | 2 | 0.00 | [0.00, 0.00] | 0.0 | 0/2 |
| B-restart#2 | tokyo-like | medium | 2 | 2 | 0.00 | [0.00, 0.00] | 0.0 | 0/2 |
| B-restart#2 | tokyo-like | high | 2 | 2 | 0.00 | [0.00, 0.00] | 0.0 | 0/2 |
| B-restart#2 | nyc-like | low | 2 | 2 | 0.00 | [0.00, 0.00] | 0.0 | 0/2 |
| B-restart#2 | nyc-like | medium | 2 | 2 | 0.00 | [0.00, 0.00] | 0.0 | 0/2 |
| B-restart#2 | nyc-like | high | 2 | 2 | 0.00 | [0.00, 0.00] | 0.0 | 0/2 |
| B-self#1 | sf-like | low | 2 | 2 | 0.00 | [0.00, 0.00] | 0.0 | 0/2 |
| B-self#1 | sf-like | medium | 2 | 2 | 0.00 | [0.00, 0.00] | 0.0 | 0/2 |
| B-self#1 | sf-like | high | 2 | 2 | 0.00 | [0.00, 0.00] | 0.0 | 0/2 |
| B-self#1 | tokyo-like | low | 2 | 2 | 0.00 | [0.00, 0.00] | 0.0 | 0/2 |
| B-self#1 | tokyo-like | medium | 2 | 2 | 0.00 | [0.00, 0.00] | 0.0 | 0/2 |
| B-self#1 | tokyo-like | high | 2 | 2 | 0.00 | [0.00, 0.00] | 0.0 | 0/2 |
| B-self#1 | nyc-like | low | 2 | 2 | 0.00 | [0.00, 0.00] | 0.0 | 0/2 |
| B-self#1 | nyc-like | medium | 2 | 2 | 0.00 | [0.00, 0.00] | 0.0 | 0/2 |
| B-self#1 | nyc-like | high | 2 | 2 | 0.00 | [0.00, 0.00] | 0.0 | 0/2 |
| B-self#2 | sf-like | low | 2 | 2 | 0.00 | [0.00, 0.00] | 0.0 | 0/2 |
| B-self#2 | sf-like | medium | 2 | 2 | 0.00 | [0.00, 0.00] | 0.0 | 0/2 |
| B-self#2 | sf-like | high | 2 | 2 | 0.00 | [0.00, 0.00] | 0.0 | 0/2 |
| B-self#2 | tokyo-like | low | 2 | 2 | 0.00 | [0.00, 0.00] | 0.0 | 0/2 |
| B-self#2 | tokyo-like | medium | 2 | 2 | 0.00 | [0.00, 0.00] | 0.0 | 0/2 |
| B-self#2 | tokyo-like | high | 2 | 2 | 0.00 | [0.00, 0.00] | 0.0 | 0/2 |
| B-self#2 | nyc-like | low | 2 | 2 | 0.00 | [0.00, 0.00] | 0.0 | 0/2 |
| B-self#2 | nyc-like | medium | 2 | 2 | 0.00 | [0.00, 0.00] | 0.0 | 0/2 |
| B-self#2 | nyc-like | high | 2 | 2 | 0.00 | [0.00, 0.00] | 0.0 | 0/2 |

## Generalisation: seen versus held-out cities

Held-out cities were excluded from development and validation.

| campaign | mode | group | runs | success | pain (complete only) |
| --- | --- | --- | --- | --- | --- |
| B0-1 | B0 | seen | 12 | 33% | 4344.36 |
| B0-1 | B0 | held-out | 6 | 33% | 4244.06 |
| B0-2 | B0 | seen | 12 | 33% | 4344.36 |
| B0-2 | B0 | held-out | 6 | 33% | 4244.06 |
| B-restart-1 | B-restart | seen | 12 | 100% | 9.03 |
| B-restart-1 | B-restart | held-out | 6 | 100% | 12.77 |
| B-restart-2 | B-restart | seen | 12 | 100% | 9.03 |
| B-restart-2 | B-restart | held-out | 6 | 100% | 12.77 |
| B-self-1 | B-self | seen | 12 | 100% | 9.03 |
| B-self-1 | B-self | held-out | 6 | 100% | 12.77 |
| B-self-2 | B-self | seen | 12 | 100% | 9.03 |
| B-self-2 | B-self | held-out | 6 | 100% | 12.77 |

## Cost per run when one artifact serves K runs (G/K + R)

Generated programs pay generation once and no API cost per run (CPU shown separately). References use the stated preparation cost plus their measured per-run API cost.

| policy | kind | G (USD) | R (USD) | CPU/run (ms) | K=1 | K=10 | K=100 | K=1000 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| B0#1 | generated-program | 0.0000 | 0.0000 | 6 | 0.0000 | 0.0000 | 0.0000 | 0.0000 |
| B0#2 | generated-program | 0.0000 | 0.0000 | 6 | 0.0000 | 0.0000 | 0.0000 | 0.0000 |
| B-restart#1 | generated-program | 0.0000 | 0.0000 | 4 | 0.0000 | 0.0000 | 0.0000 | 0.0000 |
| B-restart#2 | generated-program | 0.0000 | 0.0000 | 5 | 0.0000 | 0.0000 | 0.0000 | 0.0000 |
| B-self#1 | generated-program | 0.0000 | 0.0000 | 4 | 0.0000 | 0.0000 | 0.0000 | 0.0000 |
| B-self#2 | generated-program | 0.0000 | 0.0000 | 4 | 0.0000 | 0.0000 | 0.0000 | 0.0000 |
| fixture-append-earliest-pickup | reference | 0.0000 | 0.0000 | 0 | 0.0000 | 0.0000 | 0.0000 | 0.0000 |
| swift-insertion-reference | reference | 0.0000 | 0.0000 | 0 | 0.0000 | 0.0000 | 0.0000 | 0.0000 |
