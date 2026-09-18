# Second-paper experiments

`bus20-improve experiment` runs the whole second-paper design from one
configuration file and `bus20-improve report` turns the stored artifacts
into the paper's tables. Nothing in the report is computed from memory; every
number comes from a campaign record, a program evaluation, or a suite index
on disk.

## Design

For every mode in the configuration (`B0`, `B-restart`, `B-self`) and every
seed, one campaign runs under the same budget on the development split,
selects on the validation split, and freezes. The selected program is then
evaluated once on the test split. Reference policies (the fixture, the Swift
reference, and later online models) run on the same test split. Campaigns
resume from their directories, and finished runs are reused, so an
interrupted experiment continues without regenerating or re-spending.

- **Same budget across modes.** `B-restart` and `B-self` receive the same
  generation, evaluation, and cost budget; the comparison isolates the value
  of feedback over independent regeneration.
- **Held-out city.** `heldOutCities` are excluded from development and
  validation but kept in the test split; the report splits test results into
  seen and held-out groups.
- **Fresh data.** The second-paper suite (`datasets/synthetic-paper2-1`) has
  its own seed; no scenario is shared with the first-paper suite.

## Report contents

- **Modes at equal budget**: per mode, mean spend, the incumbent's
  development pain at the end, and the selected program's test success and
  conditional pain.
- **Improvement curves**: per campaign and iteration, cumulative generations,
  evaluations, and cost against the best accepted development pain so far,
  with rejected iterations shown.
- **Test split**: programs and references per city and load with success
  rates and bootstrap intervals, then paired differences against the Swift
  reference (or the first reference when Swift is absent).
- **Generalisation**: seen versus held-out cities for every selected program.
- **Amortisation**: cost per run when one artifact serves K runs, `G/K + R`.
  Generated programs pay generation once (`G`) and no API cost per run
  (`R = 0`, CPU shown separately). Online references use the preparation cost
  stated in the configuration plus their measured per-run API cost.

## Offline sample experiment

`experiments/paper2-sample.json` uses the **sample generator**, an offline
stand-in that picks hand-written programs from a ladder (first candidate,
append earliest pickup, minimum incremental squared delay) and "improves" one
rung per revision. It exists to exercise the pipeline and produce a real
artifact without any model call. Its results say nothing about any model,
and the report header says so.

`results/synthetic-paper2-1/sample-experiment/` holds the resulting
experiment index, campaign records, programs, evaluations, reference suite
indexes, and the analysis (run logs are not committed). One property of that
artifact is worth noting: the ladder's top program restates the Swift
reference rule in TypeScript, and its paired difference against the Swift CLI
is exactly zero in every test cell, which independently confirms the CLI
through the program runtime.

## Running with a model

Set `generator` to `{ "provider": "anthropic", "modelId": "claude-opus-5" }`
and `ANTHROPIC_API_KEY`; set `references` to include `swift` with
`BUS20_SWIFT_CLI`. Every generation's tokens and cost are recorded per
program and summed per campaign. No such run has been made from this
repository.
