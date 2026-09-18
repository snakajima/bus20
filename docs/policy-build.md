# Generated programs and self-improvement (second paper)

`@bus20/policy-runtime` and `@bus20/policy-build` are the second paper's
foundation (track B). They are separate packages: the simulator, scorer,
datasets, and first-paper adapters do not depend on them, and a
first-paper run never loads them.

## Programs

A program is one self-contained TypeScript script that declares
`function decide(observation): Action`. `compileProgram` rejects imports,
exports, `require`, `process`, `globalThis`, `eval`, `Function`, and dynamic
`import` statically, then strips types to ES2022. The frozen artifact
(`bus20-policy-program/1`) keeps source, compiled code, source digest,
lineage (`parentId`, `origin`), the generating model and prompt version, and
the generation spend. Programs that fail to compile are kept too, with
`compileError` set, and are never run.

## Isolated execution

`createProgramPolicy` runs a program in its own `node` process with a heap
cap (`--max-old-space-size`) and, inside it, a `node:vm` context with frozen
globals: no Node APIs, no console, no timers, `Math.random` seeded by the
host, `Date.now` constant. Each decision runs synchronously under a CPU
timeout; the observation is passed as a JSON clone and the returned value is
validated against the action contract before the simulator sees it. Program
CPU time is recorded per decision as `programCpuMs`. A timeout, exception,
or malformed return is a `policyError`; an unknown candidate is an
`invalidAction`. This is resource isolation for generated code, not a
hardened sandbox for adversarial code.

## Campaigns

`bus20-improve campaign` runs one campaign under rules fixed in
`selection.ts` before any generation:

- **B0**: one generation.
- **B-restart**: independent generations up to the budget; every compiling
  program is a candidate.
- **B-self**: the incumbent's source plus aggregate feedback from the
  development split (summary numbers, failure reasons and messages, worst
  scenarios; no trajectories, no reference decisions) goes back to the
  generator. A revision is accepted only if it completes at least as many
  runs and, at equal success, lowers conditional mean pain. Ties are
  rejected. Rejected revisions are kept; the lineage continues from the
  incumbent.

Budgets: generations, evaluations, and USD. Spend is accumulated from each
generation's tokens and cost and each evaluation's program CPU. When a budget
runs out the campaign stops with a recorded reason. Selection happens once,
on the validation split, among accepted programs (success first, then pain),
and the campaign is frozen. `bus20-improve test` evaluates the selected
program on the test split and writes the result beside the campaign; it
never modifies the campaign record.

The generator receives only `program-spec.ts` and, for revisions, the
incumbent and feedback. It never sees the Swift source, reference decisions,
validation or test scenarios. `@bus20/policy-build/generator` has a Claude
implementation (no fallback model) and an interface so a fake can drive
tests without any API call.

## Data separation

`datasets/synthetic-paper2-1/` is a fresh suite (different seed; every
scenario digest differs from `synthetic-dev-1`) with dev, validation, and
test splits, so second-paper development never touches first-paper test
data. If validation results are ever fed back into a revision, that split
must be reclassified as development.

## Comparing with A and C

`bus20-run run --policy program --program <programs/x.json>` and
`bus20-run suite --policies swift,program --program <file>` run a frozen
program in the common environment, so B, A, and C share scenarios, scorer,
and analysis.

## Not yet done

- No campaign has been run with a live model; all tests use scripted
  generators.
- Campaign resume after interruption is not implemented (every artifact is
  written incrementally, so a rerun can be reconstructed by hand).
- Per-campaign wall-time and memory ceilings are recorded but not enforced
  beyond the per-decision CPU timeout and heap cap.
