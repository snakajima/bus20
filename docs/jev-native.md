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

## The Jev-native presentation (`bus20-jev-prompt/1`)

`@bus20/models/jev-native` renders the same information as the shared brief
in the form the documentation recommends:

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

## Self-consistency

`repeats: k` asks each choice k times with a seeded permutation of the
option order and sums the returned probability distributions in code; the
host-order argmax wins. Every call is charged and `repeats` is recorded.

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

The native presentation carries the same information as the shared brief;
it changes form, not content. It is a Jev-specific condition and must be
reported as such, with its own prompt version. If the shared brief is ever
changed to carry per-passenger consequences too, that becomes a new shared
prompt version and both conditions are re-run.

## Observed deviations

Jev returned `confidence` values above 1.0 (1.62 and 1.07) on two decisions
under prompt v2, although the documentation defines confidence as 0 to 1.
The values are kept as reported in the run logs.
