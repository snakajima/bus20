# Bus 2.0 development disciplines

The first paper compares online decisions by general LLMs and Jev, with the
human-written Swift insertion algorithm as a reference. See
[the research plan](docs/benchmark_plan_jp.md) for scope. AI-generated policies
and self-improvement belong to the second paper.

These rules adapt the user-requested disciplines from `../mulmoclaude/CLAUDE.md`
to this standalone repository. Do not import implementation files from a sibling
checkout or assume that its packages exist here.

## TypeScript

- Use strict TypeScript, including unchecked-index and exact-optional checks.
- Validate external JSON at the boundary; do not cast it into trusted types.
- Do not use `any`, non-null assertions, or type assertions other than `as const`.
- Prefer `const`; never use `var`. Keep production functions under 20 lines
  (excluding comments and blank lines) and cognitive complexity at most 15.
- Extract pure, named helpers. Avoid re-export barrels and circular dependencies.
- Read [the shared utility catalog](docs/shared-utils.md) before adding helpers;
  update it in the same PR when adding reusable utilities.
- Use named constants for time units, event types, statuses, and paths.
- Dependencies point from runners/providers to the simulator, then to
  contracts/shared primitives. Contracts must not depend on runners or providers.
- Keep provider-specific code in adapters and simulator/scoring code free of
  network and filesystem access.

## I/O and reproducibility

- Put filesystem I/O in domain modules, use `node:path`, and write files atomically
  using a temporary file alongside the destination.
- Centralize external HTTP calls. Enforce timeouts and handle both network and
  non-success HTTP responses. Never log API keys.
- Use structured logging; reserve stdout for CLI/JSON protocol output.
- Simulation time is integer milliseconds. Wall time and model latency must not
  affect rider outcomes. Never expose future requests through policy observations.
- Pin scenario, map, model, prompt, and protocol versions in experiment results.
- Keep all failed runs and retry costs; never silently fall back to Swift.
- Do not add model-generated policies or self-improvement to the first-paper scope.
  They live in `packages/policy-runtime` and `packages/policy-build` (second
  paper) and must not be imported by the simulator, scorer, or first-paper
  adapters.

## Validation and PRs

After source changes run, in order:

```sh
yarn format
yarn build:packages
yarn typecheck
yarn lint
yarn build
yarn test
```

Define these commands as the TypeScript tooling is introduced. Use `node:test` for
meaningful correctness and regression tests. Do not suppress new lint findings.
CI must run the equivalent checks, with formatting checked rather than rewritten.
Test deterministic replay, input validation, request visibility, capacity,
event ordering, and independently calculated passenger pain.

Create one PR per milestone. Dependent PRs may be stacked on the previous branch;
state the dependency in their descriptions. Do not merge without instruction.
Use PR body files to preserve literal Markdown safely.
