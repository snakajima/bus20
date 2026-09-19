# Decision diagnosis

Every decision of every stored run, replayed and scored against the insertion rule. Rank 0 is the rule's cheapest insertion; regret is the immediate squared delay given away against it, in min²; normalized rank 0.5 is what uniform random choice would score. Biases are chosen minus best, in minutes or passengers, averaged over all decisions.

## Overall

All loads, all candidate counts.

| policy | group | decisions | best | top 3 | bottom half | norm. rank | regret mean | median | p90 | wait bias | detour bias | others delayed bias | largest delay bias |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| laya:cumulative:auto:top3:x3 | all | 4032 | 45.3% | 100.0% | 1.0% | 0.05 | 4.69 | 0.62 | 14.16 | +0.26 | -0.08 | +0.24 | +0.34 |
| random-reference:top3 | all | 4032 | 38.1% | 100.0% | 1.7% | 0.06 | 7.00 | 2.11 | 20.51 | +0.53 | +0.12 | +0.16 | +0.22 |

## By load

Same measures per load level.

| policy | group | decisions | best | top 3 | bottom half | norm. rank | regret mean | median | p90 | wait bias | detour bias | others delayed bias | largest delay bias |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| laya:cumulative:auto:top3:x3 | low | 720 | 52.1% | 100.0% | 4.6% | 0.10 | 2.92 | 0.00 | 8.39 | +0.33 | +0.03 | +0.10 | +0.19 |
| laya:cumulative:auto:top3:x3 | medium | 1440 | 43.8% | 100.0% | 0.2% | 0.05 | 4.23 | 0.77 | 12.40 | +0.29 | -0.11 | +0.24 | +0.33 |
| laya:cumulative:auto:top3:x3 | high | 1872 | 43.9% | 100.0% | 0.3% | 0.04 | 5.72 | 1.22 | 16.99 | +0.22 | -0.10 | +0.29 | +0.40 |
| random-reference:top3 | low | 720 | 38.2% | 100.0% | 4.6% | 0.12 | 4.54 | 1.35 | 13.15 | +0.59 | +0.10 | +0.10 | +0.17 |
| random-reference:top3 | medium | 1440 | 35.6% | 100.0% | 1.7% | 0.06 | 7.84 | 2.74 | 22.07 | +0.60 | +0.12 | +0.19 | +0.25 |
| random-reference:top3 | high | 1872 | 39.9% | 100.0% | 0.6% | 0.04 | 7.28 | 2.10 | 21.73 | +0.44 | +0.14 | +0.17 | +0.22 |

## By number of candidates offered

Whether quality degrades as the choice set grows.

| policy | group | decisions | best | top 3 | bottom half | norm. rank | regret mean | median | p90 | wait bias | detour bias | others delayed bias | largest delay bias |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| laya:cumulative:auto:top3:x3 | 1-10 | 738 | 56.1% | 100.0% | 5.7% | 0.13 | 1.31 | 0.00 | 4.40 | +0.24 | +0.01 | +0.02 | +0.04 |
| laya:cumulative:auto:top3:x3 | 11-40 | 1914 | 41.4% | 100.0% | 0.0% | 0.05 | 4.61 | 1.25 | 13.30 | +0.33 | -0.01 | +0.24 | +0.36 |
| laya:cumulative:auto:top3:x3 | 41-100 | 1233 | 44.0% | 100.0% | 0.0% | 0.01 | 6.65 | 2.08 | 19.01 | +0.19 | -0.22 | +0.34 | +0.47 |
| laya:cumulative:auto:top3:x3 | 101+ | 147 | 53.1% | 100.0% | 0.0% | 0.01 | 6.24 | 0.00 | 18.66 | +0.12 | -0.27 | +0.45 | +0.33 |
| random-reference:top3 | 1-10 | 656 | 37.5% | 100.0% | 10.5% | 0.20 | 3.26 | 1.12 | 9.76 | +0.76 | +0.01 | +0.01 | +0.02 |
| random-reference:top3 | 11-40 | 1898 | 34.6% | 100.0% | 0.0% | 0.05 | 6.92 | 2.63 | 20.15 | +0.60 | +0.16 | +0.17 | +0.26 |
| random-reference:top3 | 41-100 | 1246 | 41.8% | 100.0% | 0.0% | 0.02 | 8.57 | 2.79 | 24.72 | +0.30 | +0.14 | +0.25 | +0.28 |
| random-reference:top3 | 101+ | 232 | 47.8% | 100.0% | 0.0% | 0.01 | 9.76 | 0.80 | 30.97 | +0.49 | +0.08 | +0.13 | +0.19 |

## By reported confidence (Jev)

Quartiles of the model's own confidence; a useful signal shows falling regret from q1 to q4.

| policy | group | decisions | best | top 3 | bottom half | norm. rank | regret mean | median | p90 | wait bias | detour bias | others delayed bias | largest delay bias |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| laya:cumulative:auto:top3:x3 | q4 (highest) | 1008 | 54.2% | 100.0% | 2.1% | 0.05 | 4.47 | 0.00 | 13.35 | +0.24 | -0.18 | +0.18 | +0.29 |
| laya:cumulative:auto:top3:x3 | q3 | 1008 | 41.1% | 100.0% | 1.8% | 0.06 | 4.58 | 0.92 | 13.68 | +0.26 | -0.12 | +0.29 | +0.38 |
| laya:cumulative:auto:top3:x3 | q2 | 1008 | 42.6% | 100.0% | 0.3% | 0.05 | 4.56 | 1.25 | 13.89 | +0.26 | -0.01 | +0.23 | +0.35 |
| laya:cumulative:auto:top3:x3 | q1 (lowest) | 1008 | 43.5% | 100.0% | 0.0% | 0.04 | 5.14 | 0.90 | 16.00 | +0.31 | -0.03 | +0.24 | +0.33 |

