# Laya configuration pilot (2026-09-19)

Laya (`@receptron/laya@0.1.1`, local ONNX bundle) with prompt v4 on three dev
scenarios of synthetic-dev-2, one run each: the rule's `top K` cheapest
insertions offered as one sentence per option, and `x N` permuted asks
summed by self-consistency. Swift scores 3.37 / 10.22 / 9.37 on these.

| shortlist | asks | sf-like-low-dev-01 | nyc-like-medium-dev-01 | tokyo-like-high-dev-03 |
| --- | --- | --- | --- | --- |
| top 2 | x3 | 4.40 | 11.97 | 14.15 |
| top 3 | x3 | 3.50 | 11.37 | 16.65 |
| top 3 | x5 | 4.51 | 16.81 | 15.66 |
| top 4 | x3 | 5.69 | 17.11 | 21.67 |
| top 4 | x5 | 7.02 | 32.51 | 25.56 |
| top 6 | x1 | 35.29 | 160.34 | 69.68 |
| top 6 | x3 | 13.72 | 66.31 | 31.09 |
| top 8 | x3 | 73.73 | 95.47 | 118.84 |

A single ask is worse than random within the shortlist: Laya's
distributions are near-uniform (confidence about 0.05) with a strong bias
toward the first labels. Permuted repeats cancel the bias, and the model
does better the fewer options it sees; top 3 with three asks was chosen
for the dev-split run. Probing the model directly (same day) showed it
reads sentences far better than compact codes and goes flat above six
options, which fixed the adapter's rendering and choice size.
