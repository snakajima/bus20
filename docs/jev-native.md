# Using Jev effectively

Jev is a System One model. Its documentation is explicit about what it is
not: "Jev is not a calculator", it "does not count reliably", it "reads dates
as text, not as ordered quantities", it "answers the question you wrote, not
the one you meant", and "unrelated detail acts as a distractor". The
documented way to build with it is: "keep deterministic work in code",
"include only the context relevant to the current questions", describe
options with "the same field names across options so the model can compare
them directly", and prefer semantic over numeric representations.

The first two prompt versions violated most of that. Version 1 repeated every
vehicle's full stop list per candidate; version 2 handed Jev decimal times
and two shift constants and asked it to compare them. On the smoke fixture
Jev scored 50.8 and then 157.6 min² against the Swift reference's 16.2.

## The consequences presentation (`bus20-prompt/3`)

`@bus20/models/jev-native` renders the same information as the numeric brief
(`bus20-prompt/2`) in the form the documentation recommends. It was first
used for Jev alone as `bus20-jev-prompt/1`; since the content proved just as
suitable for general LLMs it is now shared prompt version 3, the default for
both Claude and Jev, with identical content under the new name:

- **Arithmetic in code.** For every candidate the host computes the new
  passenger's wait and detour and, for every existing passenger of that
  vehicle, how many minutes later their drop-off becomes. Only these
  consequences are shown, never planned arrival times. Pain and rankings are
  still withheld.
- **Whole minutes and words.** Every option carries the same named fields
  (`new_passenger_wait_minutes`, `new_passenger_detour_minutes`,
  `passengers_delayed`, `largest_delay_to_others_minutes`) plus one sentence,
  for example "Vehicle v1: picked up in 3 minutes, 3 minutes of detour,
  delays r1 by 1 minute and r2 by 3 minutes."
- **Filtered state.** The state holds the deciding passenger (how long they
  have waited, their direct ride time) and a one-line fleet summary. No stop
  lists, no candidate list, no other requests.
- **Literal, structured instructions.** The question is an object with
  `task`, `how_to_read_options`, and `note`, stating that each delay is
  squared so one large delay hurts more than several small ones.

The hierarchical procedure works with this presentation too: stage one
describes each vehicle in words (idle or busy, riders on board, soonest
pickup in minutes, number of legal insertions).

## Large candidate sets: the tournament

Jev accepts at most 255 options per question and about 64k input tokens
per call, which the native presentation reaches near 220 candidates. Jev's
default choice mode is therefore `tournament`: flat up to `flatLimit` (180)
candidates; beyond that, the candidates are split into chunks of
`chunkSize` (120), one Choice per chunk is asked in a single systemOne call
(Jev scores questions independently within one call, so this costs about
one flat call), and a final Choice picks among the chunk winners. Unlike
the vehicle-first hierarchy, every candidate is judged as a real option
with its full description; `stages` records the number of questions.

## Self-consistency

`repeats: k` asks each choice k times with a seeded permutation of the
option order and sums the returned probability distributions in code; the
host-order argmax wins. Every call is charged and `repeats` is recorded.

## Dev-split runs

`results/synthetic-dev-1/dev-jev-native/`: on the original dev suite
(high load at 0.8 utilisation, 50% hotspot burst), Swift beat Jev on all 24
completed pairs and Jev failed three high-load runs on its limits. The gap
tracked candidate-set size: near parity at 16 to 40 candidates, 4 to 17×
worse at 135 to 230.

`results/synthetic-dev-2/dev-high-jev/`: with high load at 0.65 and a 40%
hotspot burst over 15 minutes, plus the tournament, all nine high-load
runs complete, Jev is 1.4 to 3.1× Swift on uniform and commute demand
(one win), and 2.5 to 4.5× on hotspot demand.

## Smoke pilot

One scenario, one repetition; direction, not evidence.

| Jev configuration | pain (min²) | latency p50 | tokens in | cost |
| --- | --- | --- | --- | --- |
| prompt v1, flat | 50.81 | 197 ms | 122,234 | $0.005 |
| prompt v2, auto | 157.60 | 217 ms | 42,230 | $0.002 |
| native, flat | **11.65** | 148 ms | 28,280 | $0.0013 |
| native, hierarchical | 26.56 | 247 ms | 24,983 | $0.0011 |
| native, flat, 3 repeats | 13.48 | 383 ms | 85,110 | $0.004 |

For reference, the Swift insertion rule scores 16.23 on this scenario and
Claude opus-5 at low effort with the shared brief 16.23.

## Fairness

The consequences presentation carries the same information as the numeric
brief; it changes form, not content. Both models see the same state, the same
option fields, and the same instruction text (Claude receives it as a system
prompt, Jev as the structured question). Results under `bus20-prompt/2` and
`bus20-prompt/3` are never pooled; see
`results/pilot/smoke/prompt-v3/` for Claude under both.

## Observed deviations

Jev returned `confidence` values above 1.0 (1.62 and 1.07) on two decisions
under prompt v2, although the documentation defines confidence as 0 to 1.
The values are kept as reported in the run logs.
