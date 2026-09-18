# Smoke pilot (2026-09-18)

First live calls from this repository: Jev and Claude on the smoke fixture
(3×3 grid, 2 vehicles of capacity 4, 12 requests). One scenario, one
repetition; a pipeline check, not evidence.

- `prompt-v1/`: prompt `bus20-prompt/1` (full stop lists per candidate),
  Claude at effort `high`. Plus the fixture and Swift reference runs.
- `prompt-v2/`: prompt `bus20-prompt/2` (compact candidates), Claude at
  effort `low`, each model in `auto` and forced `hierarchical` choice mode.

| policy | prompt | choice | pain (min²) | latency p50 (ms) | tokens in | cost (USD) |
| --- | --- | --- | --- | --- | --- | --- |
| Swift reference | – | – | 16.23 | 1 | – | – |
| Jev jev-1.13.0 | v1 | flat | 50.81 | 197 | 122,234 | 0.005 |
| Claude opus-5, high | v1 | flat | 15.90 | 11,065 | 86,099 | 0.713 |
| Jev jev-1.13.0 | v2 | auto | 157.60 | 217 | 42,230 | 0.002 |
| Jev jev-1.13.0 | v2 | hierarchical | 135.56 | 242 | 45,635 | 0.002 |
| Claude opus-5, low | v2 | auto | 16.23 | 4,500 | 44,915 | 0.295 |
| Claude opus-5, low | v2 | hierarchical | 26.90 | 6,405 | 56,243 | 0.333 |

Observations, all from a single scenario:

- Compact candidates halve input tokens here; the saving grows with the
  length of the stop lists (the encoding is O(1) per candidate instead of
  O(stops)).
- Claude at low effort with compact candidates matched the Swift
  reference's pain exactly, with different decisions.
- Jev's pain rose sharply under the compact encoding. Its confidence fell
  below 0.3 on most later decisions, and it reported confidence values above
  1.0 (1.62, 1.07) on two decisions, which the documentation describes as a
  0 to 1 quantity. Both are recorded as-is in the run logs.
- The hierarchical choice helped Jev slightly and hurt Claude on this
  scenario; each stage costs a call, so it only pays when candidate sets are
  large.

Results across prompt versions must not be pooled.
