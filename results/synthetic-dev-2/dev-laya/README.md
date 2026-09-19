# synthetic-dev/2, dev split: Laya, the open-source Jev-compatible model (2026-09-19)

Laya (Convai Innovations; `@receptron/laya@0.1.1`, ONNX bundle
`receptron/laya-onnx`, run locally on CPU) with prompt v4, choosing among
the insertion rule's three cheapest insertions with three permuted asks
summed by self-consistency (`--presentation cumulative --shortlist 3
--repeats 3`), the best configuration of the pilot in
`results/pilot/laya`. 27 dev scenarios, three repetitions, all 81 runs
complete. The index also carries Swift, random choice from the top 3 and
top 8, and Jev with the top 8 for comparison.

Equal-weight pain over cities (min², lower is better):

| policy | low | medium | high | cost (81 runs) | latency |
| --- | --- | --- | --- | --- | --- |
| Swift insertion rule | 3.78 | 9.40 | 13.60 | $0 | <1 ms |
| Jev v4, top 8 | 3.99 | 11.89 | 17.40 | $0.28 | 0.13 s |
| **Laya v4, top 3, x3** | **6.31** | **14.52** | **20.43** | $0 (local) | 2.9 s (3 asks, 4 threads) |
| Random from the top 3 | 9.03 | 20.10 | 25.71 | $0 | <1 ms |
| Random from the top 8 | 54.04 | 73.82 | 78.90 | $0 | <1 ms |

Laya never beats Swift (0 of 81 pairs) and trails it by 50 to 70%. It is
clearly better than random choice from the same three options (30% lower
pain at every load), so it is reading the options, but it is far from Jev,
which handles eight options in one ask and lands within 5 to 28% of Swift.

Decision diagnosis (`diagnosis/`): rule's best 45.3% (random top 3:
38.1%), mean regret 4.69 (7.00), and its confidence is barely informative
(top quartile 54% best, bottom 44%), unlike Jev's, which separates 94%
from 38%. Probing the model directly showed why the configuration had to
be this narrow: a single ask is worse than random within the shortlist
(near-uniform probabilities with a strong bias toward the first labels),
options must be sentences rather than codes, and choices go flat above
six options because its 192-token question head truncates them. Permuted
repeats cancel the label bias; the small shortlist keeps the sentences
intact.

For the paper: Laya is usable as a free, local, Jev-compatible reference
point, but on this task it is a much weaker model than Jev, not a drop-in
replacement.
