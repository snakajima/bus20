# Decision diagnosis

Every decision of every stored run, replayed and scored against the insertion rule. Rank 0 is the rule's cheapest insertion; regret is the immediate squared delay given away against it, in min²; normalized rank 0.5 is what uniform random choice would score. Biases are chosen minus best, in minutes or passengers, averaged over all decisions.

## Overall

All loads, all candidate counts.

| policy | group | decisions | best | top 3 | bottom half | norm. rank | regret mean | median | p90 | wait bias | detour bias | others delayed bias | largest delay bias |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| jev:jev-1.13.0:consequences:tournament:x1 | all | 4032 | 62.0% | 83.0% | 2.0% | 0.06 | 13.41 | 0.00 | 24.12 | -0.38 | -0.00 | +0.36 | +0.34 |
| jev:jev-1.13.0:cumulative:tournament:x1 | all | 4032 | 65.9% | 86.4% | 1.2% | 0.05 | 10.36 | 0.00 | 15.56 | -0.10 | -0.00 | +0.15 | +0.16 |

## By load

Same measures per load level.

| policy | group | decisions | best | top 3 | bottom half | norm. rank | regret mean | median | p90 | wait bias | detour bias | others delayed bias | largest delay bias |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| jev:jev-1.13.0:consequences:tournament:x1 | low | 720 | 72.9% | 94.0% | 1.3% | 0.06 | 1.40 | 0.00 | 3.09 | -0.09 | +0.03 | +0.07 | +0.12 |
| jev:jev-1.13.0:consequences:tournament:x1 | medium | 1440 | 63.8% | 86.0% | 1.8% | 0.05 | 10.21 | 0.00 | 18.41 | -0.33 | -0.03 | +0.31 | +0.33 |
| jev:jev-1.13.0:consequences:tournament:x1 | high | 1872 | 56.5% | 76.4% | 2.4% | 0.07 | 20.49 | 0.00 | 42.30 | -0.53 | +0.01 | +0.51 | +0.42 |
| jev:jev-1.13.0:cumulative:tournament:x1 | low | 720 | 77.2% | 96.7% | 0.7% | 0.05 | 0.61 | 0.00 | 1.60 | -0.01 | +0.02 | +0.01 | +0.02 |
| jev:jev-1.13.0:cumulative:tournament:x1 | medium | 1440 | 69.0% | 90.1% | 0.7% | 0.04 | 5.87 | 0.00 | 8.30 | -0.08 | -0.01 | +0.11 | +0.13 |
| jev:jev-1.13.0:cumulative:tournament:x1 | high | 1872 | 59.3% | 79.6% | 1.9% | 0.05 | 17.57 | 0.00 | 37.79 | -0.16 | -0.00 | +0.24 | +0.25 |

## By number of candidates offered

Whether quality degrades as the choice set grows.

| policy | group | decisions | best | top 3 | bottom half | norm. rank | regret mean | median | p90 | wait bias | detour bias | others delayed bias | largest delay bias |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| jev:jev-1.13.0:consequences:tournament:x1 | 1-10 | 823 | 77.2% | 98.9% | 1.7% | 0.06 | 0.39 | 0.00 | 1.20 | +0.01 | +0.00 | +0.00 | +0.00 |
| jev:jev-1.13.0:consequences:tournament:x1 | 11-40 | 2005 | 65.8% | 87.3% | 1.1% | 0.05 | 4.05 | 0.00 | 10.66 | -0.20 | +0.02 | +0.19 | +0.26 |
| jev:jev-1.13.0:consequences:tournament:x1 | 41-100 | 1043 | 46.8% | 67.4% | 3.1% | 0.07 | 31.01 | 1.50 | 80.01 | -0.88 | +0.01 | +0.78 | +0.67 |
| jev:jev-1.13.0:consequences:tournament:x1 | 101+ | 161 | 36.0% | 48.4% | 6.8% | 0.12 | 82.56 | 14.56 | 239.74 | -1.27 | -0.34 | +1.53 | +0.82 |
| jev:jev-1.13.0:cumulative:tournament:x1 | 1-10 | 832 | 76.0% | 99.4% | 1.2% | 0.06 | 0.30 | 0.00 | 1.02 | +0.02 | +0.01 | -0.00 | -0.00 |
| jev:jev-1.13.0:cumulative:tournament:x1 | 11-40 | 1923 | 72.4% | 92.5% | 0.2% | 0.03 | 2.12 | 0.00 | 5.12 | -0.04 | +0.02 | +0.05 | +0.10 |
| jev:jev-1.13.0:cumulative:tournament:x1 | 41-100 | 1050 | 51.2% | 71.3% | 2.1% | 0.06 | 23.30 | 0.00 | 56.73 | -0.29 | -0.01 | +0.35 | +0.34 |
| jev:jev-1.13.0:cumulative:tournament:x1 | 101+ | 227 | 42.3% | 57.7% | 6.2% | 0.09 | 57.23 | 4.54 | 176.45 | -0.21 | -0.20 | +0.73 | +0.52 |

## By reported confidence (Jev)

Quartiles of the model's own confidence; a useful signal shows falling regret from q1 to q4.

| policy | group | decisions | best | top 3 | bottom half | norm. rank | regret mean | median | p90 | wait bias | detour bias | others delayed bias | largest delay bias |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| jev:jev-1.13.0:consequences:tournament:x1 | q4 (highest) | 971 | 93.7% | 99.4% | 0.2% | 0.01 | 0.38 | 0.00 | 0.00 | -0.03 | -0.01 | +0.01 | +0.01 |
| jev:jev-1.13.0:consequences:tournament:x1 | q1 (lowest) | 1054 | 37.6% | 60.9% | 4.4% | 0.11 | 33.31 | 4.74 | 89.53 | -0.67 | +0.04 | +0.74 | +0.72 |
| jev:jev-1.13.0:consequences:tournament:x1 | q3 | 1000 | 70.2% | 91.7% | 0.7% | 0.04 | 3.91 | 0.00 | 5.12 | -0.30 | -0.05 | +0.22 | +0.17 |
| jev:jev-1.13.0:consequences:tournament:x1 | q2 | 1007 | 49.0% | 81.6% | 2.5% | 0.08 | 14.59 | 0.07 | 26.57 | -0.49 | +0.01 | +0.44 | +0.41 |
| jev:jev-1.13.0:cumulative:tournament:x1 | q4 (highest) | 982 | 93.3% | 99.4% | 0.4% | 0.01 | 0.27 | 0.00 | 0.00 | +0.00 | +0.00 | -0.01 | -0.01 |
| jev:jev-1.13.0:cumulative:tournament:x1 | q2 | 996 | 59.1% | 86.5% | 0.4% | 0.06 | 7.34 | 0.00 | 13.61 | -0.33 | +0.01 | +0.24 | +0.22 |
| jev:jev-1.13.0:cumulative:tournament:x1 | q3 | 1003 | 77.3% | 97.6% | 0.2% | 0.03 | 0.96 | 0.00 | 1.94 | -0.02 | -0.01 | +0.02 | +0.01 |
| jev:jev-1.13.0:cumulative:tournament:x1 | q1 (lowest) | 1051 | 36.1% | 63.6% | 3.8% | 0.09 | 31.64 | 3.80 | 81.09 | -0.06 | -0.00 | +0.35 | +0.41 |

