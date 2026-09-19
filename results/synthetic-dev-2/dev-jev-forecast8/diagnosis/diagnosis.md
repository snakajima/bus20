# Decision diagnosis

Every decision of every stored run, replayed and scored against the insertion rule. Rank 0 is the rule's cheapest insertion; regret is the immediate squared delay given away against it, in min²; normalized rank 0.5 is what uniform random choice would score. Biases are chosen minus best, in minutes or passengers, averaged over all decisions.

## Overall

All loads, all candidate counts.

| policy | group | decisions | best | top 3 | bottom half | norm. rank | regret mean | median | p90 | wait bias | detour bias | others delayed bias | largest delay bias |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | all | 4032 | 72.6% | 94.4% | 0.2% | 0.03 | 1.66 | 0.00 | 5.00 | -0.02 | +0.07 | -0.01 | -0.01 |
| jev:jev-1.13.0:forecast:auto:top8:x1 | all | 4032 | 77.2% | 95.3% | 0.2% | 0.02 | 1.18 | 0.00 | 2.93 | -0.02 | +0.08 | -0.03 | -0.02 |

## By load

Same measures per load level.

| policy | group | decisions | best | top 3 | bottom half | norm. rank | regret mean | median | p90 | wait bias | detour bias | others delayed bias | largest delay bias |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | low | 720 | 79.6% | 98.1% | 0.4% | 0.04 | 0.37 | 0.00 | 1.29 | +0.01 | +0.02 | -0.00 | +0.00 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | medium | 1440 | 72.5% | 94.7% | 0.2% | 0.03 | 1.62 | 0.00 | 5.13 | -0.01 | +0.07 | -0.02 | +0.00 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | high | 1872 | 70.1% | 92.8% | 0.2% | 0.02 | 2.18 | 0.00 | 7.13 | -0.05 | +0.09 | -0.00 | -0.02 |
| jev:jev-1.13.0:forecast:auto:top8:x1 | low | 720 | 80.4% | 97.9% | 0.4% | 0.04 | 0.33 | 0.00 | 0.75 | +0.03 | +0.02 | -0.02 | -0.02 |
| jev:jev-1.13.0:forecast:auto:top8:x1 | medium | 1440 | 77.8% | 96.5% | 0.3% | 0.02 | 1.17 | 0.00 | 2.82 | +0.01 | +0.07 | -0.04 | -0.03 |
| jev:jev-1.13.0:forecast:auto:top8:x1 | high | 1872 | 75.6% | 93.4% | 0.0% | 0.02 | 1.53 | 0.00 | 4.70 | -0.07 | +0.10 | -0.02 | -0.00 |

## By number of candidates offered

Whether quality degrades as the choice set grows.

| policy | group | decisions | best | top 3 | bottom half | norm. rank | regret mean | median | p90 | wait bias | detour bias | others delayed bias | largest delay bias |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | 1-10 | 851 | 74.5% | 99.2% | 1.2% | 0.07 | 0.33 | 0.00 | 1.15 | +0.01 | +0.00 | -0.00 | -0.01 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | 11-40 | 2013 | 75.7% | 95.3% | 0.0% | 0.02 | 1.00 | 0.00 | 3.23 | +0.00 | +0.05 | -0.02 | -0.00 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | 41-100 | 1118 | 66.3% | 89.9% | 0.0% | 0.01 | 3.67 | 0.00 | 11.84 | -0.09 | +0.13 | +0.00 | -0.02 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | 101+ | 50 | 62.0% | 80.0% | 0.0% | 0.01 | 5.68 | 0.00 | 21.42 | -0.28 | +0.56 | -0.10 | -0.08 |
| jev:jev-1.13.0:forecast:auto:top8:x1 | 1-10 | 903 | 80.6% | 99.4% | 0.9% | 0.05 | 0.16 | 0.00 | 0.44 | +0.01 | +0.00 | -0.00 | -0.00 |
| jev:jev-1.13.0:forecast:auto:top8:x1 | 11-40 | 2006 | 79.3% | 96.3% | 0.0% | 0.02 | 0.71 | 0.00 | 2.37 | +0.00 | +0.05 | -0.01 | -0.02 |
| jev:jev-1.13.0:forecast:auto:top8:x1 | 41-100 | 1050 | 71.7% | 90.8% | 0.0% | 0.01 | 2.75 | 0.00 | 10.18 | -0.06 | +0.16 | -0.07 | -0.02 |
| jev:jev-1.13.0:forecast:auto:top8:x1 | 101+ | 73 | 58.9% | 82.2% | 0.0% | 0.01 | 4.33 | 0.00 | 14.96 | -0.30 | +0.58 | -0.26 | -0.14 |

## By reported confidence (Jev)

Quartiles of the model's own confidence; a useful signal shows falling regret from q1 to q4.

| policy | group | decisions | best | top 3 | bottom half | norm. rank | regret mean | median | p90 | wait bias | detour bias | others delayed bias | largest delay bias |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | q4 (highest) | 1006 | 95.6% | 99.6% | 0.2% | 0.01 | 0.06 | 0.00 | 0.00 | -0.01 | +0.01 | -0.00 | -0.00 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | q1 (lowest) | 1039 | 49.0% | 85.2% | 0.5% | 0.05 | 4.28 | 0.10 | 11.92 | -0.03 | +0.11 | +0.03 | +0.04 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | q3 | 981 | 80.0% | 98.4% | 0.3% | 0.03 | 0.51 | 0.00 | 1.54 | -0.02 | +0.03 | -0.03 | -0.02 |
| jev:jev-1.13.0:cumulative:auto:top8:x1 | q2 | 1006 | 66.9% | 95.0% | 0.0% | 0.03 | 1.65 | 0.00 | 5.34 | -0.04 | +0.13 | -0.04 | -0.05 |
| jev:jev-1.13.0:forecast:auto:top8:x1 | q3 | 975 | 87.1% | 98.9% | 0.1% | 0.02 | 0.22 | 0.00 | 0.24 | -0.04 | +0.02 | -0.02 | -0.02 |
| jev:jev-1.13.0:forecast:auto:top8:x1 | q4 (highest) | 997 | 99.4% | 100.0% | 0.0% | 0.00 | 0.01 | 0.00 | 0.00 | -0.00 | +0.00 | +0.00 | +0.00 |
| jev:jev-1.13.0:forecast:auto:top8:x1 | q1 (lowest) | 1033 | 50.9% | 86.0% | 0.6% | 0.05 | 3.39 | 0.00 | 11.36 | +0.01 | +0.19 | -0.06 | -0.02 |
| jev:jev-1.13.0:forecast:auto:top8:x1 | q2 | 1027 | 72.8% | 96.7% | 0.1% | 0.03 | 1.03 | 0.00 | 2.73 | -0.05 | +0.08 | -0.03 | -0.03 |

