# Claude opus-5 (effort low): shared prompt v2 (numeric) vs v3 (consequences)

Run on 2026-09-18 after the consequence presentation, first used for Jev as
`bus20-jev-prompt/1`, became shared prompt version 3 (`bus20-prompt/3`) and
the default for both Claude and Jev. Each scenario was run once with Swift
(reference), Claude at effort `low` with `--presentation numeric`
(`bus20-prompt/2`) and with `--presentation consequences` (`bus20-prompt/3`).
Choice mode `auto` with flat limit 40; every decision stayed flat (at most
40 candidates), so the two Claude conditions differ only in the presentation.

| scenario | requests | Swift | Claude v2 numeric | Claude v3 consequences |
| --- | --- | --- | --- | --- |
| smoke-01 | 12 | 16.23 | 20.98 ($0.288, p50 4.9 s) | 18.56 ($0.212, p50 2.3 s) |
| sf-like-low-dev-01 | 28 | 3.37 | 3.40 ($0.383, p50 2.6 s) | **3.18** ($0.300, p50 2.2 s) |
| tokyo-like-low-dev-02 | 31 | 1.81 | 1.90 ($0.478, p50 2.8 s) | 2.26 ($0.393, p50 2.4 s) |
| nyc-like-medium-dev-01 | 42 | 10.22 | **8.98** ($0.994, p50 4.0 s) | **8.72** ($0.733, p50 2.4 s) |

Pain in min² (lower is better); bold beats Swift. Totals over the 113
decisions: v2 $2.14, v3 $1.64 (23% cheaper, mainly output tokens: 13,645 vs
2,412); v3 p95 latency is 3-4 s against 6-12 s for v2.

Observations:

- v3 wins three of four scenarios on pain and all four on cost and latency.
  Claude beats Swift on the medium-load NYC scenario under both prompts.
- The earlier v2 smoke result (`results/pilot/smoke/prompt-v2/claude-auto`)
  scored 16.23 at $0.295; this rerun scored 20.98, so Claude's run-to-run
  variance on the 12-decision smoke fixture is at least as large as the
  difference between prompts. One repetition per scenario is a pilot, not a
  result; the dev-split run needs repetitions.
- With v3 Claude's replies are short (about 9 output tokens per decision)
  because the system prompt no longer asks it to derive shifts from indices;
  the arithmetic is in the host.

Directories: `<scenario>/swift`, `<scenario>/claude-numeric`,
`<scenario>/claude-consequences`, each with `run-log.json` and
`run-result.json`; `<scenario>/comparison.md` from `bus20-run compare`.
