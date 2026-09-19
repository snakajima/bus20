# Decision diagnosis

Every decision of every stored run, replayed and scored against the insertion rule. Rank 0 is the rule's cheapest insertion; regret is the immediate squared delay given away against it, in min²; normalized rank 0.5 is what uniform random choice would score. Biases are chosen minus best, in minutes or passengers, averaged over all decisions.

## Overall

All loads, all candidate counts.

| policy | group | decisions | best | top 3 | bottom half | norm. rank | regret mean | median | p90 | wait bias | detour bias | others delayed bias | largest delay bias |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| random-reference:top8 | all | 4032 | 15.5% | 40.6% | 4.6% | 0.12 | 49.76 | 27.24 | 124.90 | +1.74 | +0.64 | +0.67 | +0.99 |
| random-reference:all | all | 1011 | 5.2% | 16.2% | 43.5% | 0.47 | 1611.62 | 612.26 | 4554.09 | +12.89 | +2.58 | +3.11 | +3.31 |

## By load

Same measures per load level.

| policy | group | decisions | best | top 3 | bottom half | norm. rank | regret mean | median | p90 | wait bias | detour bias | others delayed bias | largest delay bias |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| random-reference:top8 | low | 720 | 15.1% | 42.5% | 13.3% | 0.24 | 47.34 | 17.82 | 127.33 | +1.95 | +0.69 | +0.61 | +1.15 |
| random-reference:top8 | medium | 1440 | 14.9% | 38.8% | 3.5% | 0.11 | 52.81 | 32.14 | 132.51 | +1.85 | +0.65 | +0.70 | +1.04 |
| random-reference:top8 | high | 1872 | 16.1% | 41.2% | 2.0% | 0.08 | 48.35 | 26.82 | 120.62 | +1.57 | +0.61 | +0.67 | +0.89 |
| random-reference:all | low | 699 | 6.2% | 18.3% | 43.6% | 0.47 | 1172.81 | 401.23 | 3292.03 | +10.18 | +2.41 | +2.69 | +3.11 |
| random-reference:all | medium | 312 | 3.2% | 11.5% | 43.3% | 0.45 | 2594.72 | 1540.17 | 6546.81 | +18.97 | +2.98 | +4.04 | +3.74 |

## By number of candidates offered

Whether quality degrades as the choice set grows.

| policy | group | decisions | best | top 3 | bottom half | norm. rank | regret mean | median | p90 | wait bias | detour bias | others delayed bias | largest delay bias |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| random-reference:top8 | 1-10 | 384 | 20.1% | 54.4% | 42.7% | 0.46 | 23.29 | 6.10 | 64.92 | +1.34 | +0.40 | +0.28 | +0.97 |
| random-reference:top8 | 11-40 | 1216 | 12.8% | 37.3% | 1.6% | 0.16 | 49.88 | 25.54 | 133.23 | +2.06 | +0.68 | +0.67 | +1.24 |
| random-reference:top8 | 41-100 | 1623 | 14.8% | 39.4% | 0.0% | 0.06 | 53.30 | 32.80 | 123.13 | +1.69 | +0.77 | +0.73 | +0.95 |
| random-reference:top8 | 101+ | 809 | 18.8% | 41.5% | 0.0% | 0.03 | 55.07 | 32.80 | 134.02 | +1.53 | +0.44 | +0.71 | +0.70 |
| random-reference:all | 1-10 | 110 | 18.2% | 61.8% | 40.0% | 0.45 | 21.48 | 4.85 | 54.31 | +1.04 | +0.35 | +0.30 | +0.95 |
| random-reference:all | 11-40 | 463 | 5.4% | 16.2% | 46.4% | 0.47 | 985.53 | 398.24 | 2746.45 | +9.52 | +2.15 | +2.50 | +3.36 |
| random-reference:all | 41-100 | 382 | 1.8% | 4.5% | 40.8% | 0.46 | 2574.62 | 1413.85 | 6364.65 | +18.68 | +3.53 | +4.36 | +3.83 |
| random-reference:all | 101+ | 56 | 1.8% | 7.1% | 44.6% | 0.46 | 3342.53 | 2615.43 | 7608.17 | +24.63 | +4.09 | +5.13 | +3.96 |

