# Decision diagnosis

Every decision of every stored run, replayed and scored against the insertion rule. Rank 0 is the rule's cheapest insertion; regret is the immediate squared delay given away against it, in min²; normalized rank 0.5 is what uniform random choice would score. Biases are chosen minus best, in minutes or passengers, averaged over all decisions.

## Overall

All loads, all candidate counts.

| policy | group | decisions | best | top 3 | bottom half | norm. rank | regret mean | median | p90 | wait bias | detour bias | others delayed bias | largest delay bias |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| swift-insertion-reference | all | 4032 | 100.0% | 100.0% | 0.0% | 0.00 | 0.00 | 0.00 | 0.00 | +0.00 | +0.00 | +0.00 | +0.00 |
| claude:claude-opus-5:low:consequences:flat | all | 4032 | 69.0% | 90.7% | 0.1% | 0.03 | 3.60 | 0.00 | 8.60 | -0.33 | +0.01 | +0.24 | +0.22 |
| rollout-reference:known:k8:s64:h10 | all | 4032 | 75.5% | 96.3% | 0.4% | 0.03 | 1.24 | 0.00 | 3.41 | +0.02 | +0.04 | +0.09 | +0.09 |
| openai:gpt-5.6-sol:low:consequences:flat | all | 4032 | 66.3% | 88.1% | 0.3% | 0.04 | 4.83 | 0.00 | 13.71 | -0.38 | -0.06 | +0.31 | +0.33 |
| gemini:gemini-3.8-flash:low:consequences:flat | all | 4032 | 70.0% | 91.1% | 0.3% | 0.03 | 3.41 | 0.00 | 7.00 | -0.25 | -0.07 | +0.19 | +0.19 |
| jev:jev-1.13.0:consequences:tournament:x1 | all | 4032 | 62.0% | 83.0% | 2.0% | 0.06 | 13.41 | 0.00 | 24.12 | -0.38 | -0.00 | +0.36 | +0.34 |

## By load

Same measures per load level.

| policy | group | decisions | best | top 3 | bottom half | norm. rank | regret mean | median | p90 | wait bias | detour bias | others delayed bias | largest delay bias |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| swift-insertion-reference | low | 720 | 100.0% | 100.0% | 0.0% | 0.00 | 0.00 | 0.00 | 0.00 | +0.00 | +0.00 | +0.00 | +0.00 |
| swift-insertion-reference | medium | 1440 | 100.0% | 100.0% | 0.0% | 0.00 | 0.00 | 0.00 | 0.00 | +0.00 | +0.00 | +0.00 | +0.00 |
| swift-insertion-reference | high | 1872 | 100.0% | 100.0% | 0.0% | 0.00 | 0.00 | 0.00 | 0.00 | +0.00 | +0.00 | +0.00 | +0.00 |
| claude:claude-opus-5:low:consequences:flat | low | 720 | 77.2% | 99.2% | 0.0% | 0.04 | 0.39 | 0.00 | 1.31 | -0.04 | +0.02 | +0.03 | +0.03 |
| claude:claude-opus-5:low:consequences:flat | medium | 1440 | 71.7% | 92.3% | 0.2% | 0.03 | 3.09 | 0.00 | 6.11 | -0.31 | +0.03 | +0.21 | +0.21 |
| claude:claude-opus-5:low:consequences:flat | high | 1872 | 63.7% | 86.2% | 0.2% | 0.03 | 5.22 | 0.00 | 14.18 | -0.46 | -0.00 | +0.35 | +0.30 |
| rollout-reference:known:k8:s64:h10 | low | 720 | 83.9% | 99.6% | 0.8% | 0.03 | 0.25 | 0.00 | 0.64 | +0.03 | +0.02 | +0.03 | +0.03 |
| rollout-reference:known:k8:s64:h10 | medium | 1440 | 76.6% | 96.5% | 0.1% | 0.02 | 1.11 | 0.00 | 3.40 | +0.02 | +0.03 | +0.09 | +0.10 |
| rollout-reference:known:k8:s64:h10 | high | 1872 | 71.4% | 94.9% | 0.5% | 0.03 | 1.73 | 0.00 | 4.94 | +0.01 | +0.05 | +0.11 | +0.10 |
| openai:gpt-5.6-sol:low:consequences:flat | low | 720 | 75.3% | 97.4% | 1.4% | 0.05 | 0.83 | 0.00 | 1.77 | -0.08 | +0.00 | +0.06 | +0.08 |
| openai:gpt-5.6-sol:low:consequences:flat | medium | 1440 | 69.0% | 89.4% | 0.2% | 0.03 | 4.16 | 0.00 | 9.79 | -0.37 | -0.06 | +0.26 | +0.33 |
| openai:gpt-5.6-sol:low:consequences:flat | high | 1872 | 60.9% | 83.4% | 0.1% | 0.04 | 6.88 | 0.00 | 21.50 | -0.52 | -0.08 | +0.44 | +0.43 |
| gemini:gemini-3.8-flash:low:consequences:flat | low | 720 | 76.5% | 97.8% | 1.1% | 0.05 | 0.47 | 0.00 | 1.55 | +0.02 | -0.02 | +0.00 | +0.00 |
| gemini:gemini-3.8-flash:low:consequences:flat | medium | 1440 | 72.8% | 91.9% | 0.2% | 0.03 | 3.32 | 0.00 | 6.57 | -0.22 | -0.06 | +0.15 | +0.17 |
| gemini:gemini-3.8-flash:low:consequences:flat | high | 1872 | 65.2% | 87.9% | 0.2% | 0.03 | 4.61 | 0.00 | 12.63 | -0.38 | -0.10 | +0.28 | +0.27 |
| jev:jev-1.13.0:consequences:tournament:x1 | low | 720 | 72.9% | 94.0% | 1.3% | 0.06 | 1.40 | 0.00 | 3.09 | -0.09 | +0.03 | +0.07 | +0.12 |
| jev:jev-1.13.0:consequences:tournament:x1 | medium | 1440 | 63.8% | 86.0% | 1.8% | 0.05 | 10.21 | 0.00 | 18.41 | -0.33 | -0.03 | +0.31 | +0.33 |
| jev:jev-1.13.0:consequences:tournament:x1 | high | 1872 | 56.5% | 76.4% | 2.4% | 0.07 | 20.49 | 0.00 | 42.30 | -0.53 | +0.01 | +0.51 | +0.42 |

## By number of candidates offered

Whether quality degrades as the choice set grows.

| policy | group | decisions | best | top 3 | bottom half | norm. rank | regret mean | median | p90 | wait bias | detour bias | others delayed bias | largest delay bias |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| swift-insertion-reference | 1-10 | 936 | 100.0% | 100.0% | 0.0% | 0.00 | 0.00 | 0.00 | 0.00 | +0.00 | +0.00 | +0.00 | +0.00 |
| swift-insertion-reference | 11-40 | 1977 | 100.0% | 100.0% | 0.0% | 0.00 | 0.00 | 0.00 | 0.00 | +0.00 | +0.00 | +0.00 | +0.00 |
| swift-insertion-reference | 41-100 | 1062 | 100.0% | 100.0% | 0.0% | 0.00 | 0.00 | 0.00 | 0.00 | +0.00 | +0.00 | +0.00 | +0.00 |
| swift-insertion-reference | 101+ | 57 | 100.0% | 100.0% | 0.0% | 0.00 | 0.00 | 0.00 | 0.00 | +0.00 | +0.00 | +0.00 | +0.00 |
| claude:claude-opus-5:low:consequences:flat | 1-10 | 892 | 75.4% | 99.3% | 0.4% | 0.06 | 0.34 | 0.00 | 1.02 | -0.02 | +0.01 | +0.02 | +0.03 |
| claude:claude-opus-5:low:consequences:flat | 11-40 | 2072 | 74.5% | 95.0% | 0.1% | 0.03 | 1.69 | 0.00 | 4.20 | -0.22 | +0.05 | +0.14 | +0.16 |
| claude:claude-opus-5:low:consequences:flat | 41-100 | 1036 | 53.5% | 75.6% | 0.0% | 0.03 | 9.88 | 0.00 | 28.01 | -0.81 | -0.05 | +0.61 | +0.50 |
| claude:claude-opus-5:low:consequences:flat | 101+ | 32 | 37.5% | 62.5% | 0.0% | 0.03 | 14.36 | 5.35 | 38.07 | -0.69 | -0.13 | +0.97 | +0.31 |
| rollout-reference:known:k8:s64:h10 | 1-10 | 936 | 77.9% | 98.3% | 1.7% | 0.06 | 0.37 | 0.00 | 1.01 | +0.10 | +0.01 | +0.01 | +0.02 |
| rollout-reference:known:k8:s64:h10 | 11-40 | 2074 | 76.7% | 97.2% | 0.0% | 0.02 | 0.98 | 0.00 | 2.73 | -0.01 | +0.06 | +0.10 | +0.10 |
| rollout-reference:known:k8:s64:h10 | 41-100 | 955 | 70.7% | 93.2% | 0.0% | 0.01 | 2.55 | 0.00 | 8.25 | -0.01 | +0.04 | +0.13 | +0.12 |
| rollout-reference:known:k8:s64:h10 | 101+ | 67 | 73.1% | 86.6% | 0.0% | 0.01 | 3.07 | 0.00 | 10.39 | +0.10 | -0.22 | +0.21 | +0.13 |
| openai:gpt-5.6-sol:low:consequences:flat | 1-10 | 901 | 76.8% | 99.1% | 1.0% | 0.06 | 0.30 | 0.00 | 0.91 | -0.02 | +0.00 | +0.02 | +0.02 |
| openai:gpt-5.6-sol:low:consequences:flat | 11-40 | 2005 | 71.0% | 92.6% | 0.2% | 0.03 | 2.41 | 0.00 | 5.41 | -0.28 | -0.03 | +0.21 | +0.28 |
| openai:gpt-5.6-sol:low:consequences:flat | 41-100 | 1076 | 51.4% | 72.4% | 0.0% | 0.04 | 12.08 | 0.00 | 38.28 | -0.84 | -0.15 | +0.68 | +0.64 |
| openai:gpt-5.6-sol:low:consequences:flat | 101+ | 50 | 14.0% | 46.0% | 0.0% | 0.05 | 27.53 | 19.58 | 45.94 | -1.42 | -0.38 | +1.66 | +1.12 |
| gemini:gemini-3.8-flash:low:consequences:flat | 1-10 | 885 | 77.3% | 99.8% | 1.1% | 0.06 | 0.29 | 0.00 | 0.91 | -0.01 | -0.00 | +0.00 | +0.01 |
| gemini:gemini-3.8-flash:low:consequences:flat | 11-40 | 1976 | 75.6% | 94.5% | 0.2% | 0.02 | 1.33 | 0.00 | 3.48 | -0.07 | -0.08 | +0.06 | +0.11 |
| gemini:gemini-3.8-flash:low:consequences:flat | 41-100 | 1128 | 55.0% | 79.2% | 0.1% | 0.03 | 9.07 | 0.00 | 28.08 | -0.73 | -0.10 | +0.52 | +0.46 |
| gemini:gemini-3.8-flash:low:consequences:flat | 101+ | 43 | 55.8% | 67.4% | 0.0% | 0.02 | 14.75 | 0.00 | 53.28 | -0.98 | -0.26 | +0.95 | +0.49 |
| jev:jev-1.13.0:consequences:tournament:x1 | 1-10 | 823 | 77.2% | 98.9% | 1.7% | 0.06 | 0.39 | 0.00 | 1.20 | +0.01 | +0.00 | +0.00 | +0.00 |
| jev:jev-1.13.0:consequences:tournament:x1 | 11-40 | 2005 | 65.8% | 87.3% | 1.1% | 0.05 | 4.05 | 0.00 | 10.66 | -0.20 | +0.02 | +0.19 | +0.26 |
| jev:jev-1.13.0:consequences:tournament:x1 | 41-100 | 1043 | 46.8% | 67.4% | 3.1% | 0.07 | 31.01 | 1.50 | 80.01 | -0.88 | +0.01 | +0.78 | +0.67 |
| jev:jev-1.13.0:consequences:tournament:x1 | 101+ | 161 | 36.0% | 48.4% | 6.8% | 0.12 | 82.56 | 14.56 | 239.74 | -1.27 | -0.34 | +1.53 | +0.82 |

## By reported confidence (Jev)

Quartiles of the model's own confidence; a useful signal shows falling regret from q1 to q4.

| policy | group | decisions | best | top 3 | bottom half | norm. rank | regret mean | median | p90 | wait bias | detour bias | others delayed bias | largest delay bias |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| jev:jev-1.13.0:consequences:tournament:x1 | q4 (highest) | 971 | 93.7% | 99.4% | 0.2% | 0.01 | 0.38 | 0.00 | 0.00 | -0.03 | -0.01 | +0.01 | +0.01 |
| jev:jev-1.13.0:consequences:tournament:x1 | q1 (lowest) | 1054 | 37.6% | 60.9% | 4.4% | 0.11 | 33.31 | 4.74 | 89.53 | -0.67 | +0.04 | +0.74 | +0.72 |
| jev:jev-1.13.0:consequences:tournament:x1 | q3 | 1000 | 70.2% | 91.7% | 0.7% | 0.04 | 3.91 | 0.00 | 5.12 | -0.30 | -0.05 | +0.22 | +0.17 |
| jev:jev-1.13.0:consequences:tournament:x1 | q2 | 1007 | 49.0% | 81.6% | 2.5% | 0.08 | 14.59 | 0.07 | 26.57 | -0.49 | +0.01 | +0.44 | +0.41 |

