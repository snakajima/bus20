# Bus 2.0

Bus 2.0 is an on-demand shared shuttle concept. This repository holds the
original Swift prototype (`bus20/`) and the TypeScript benchmark that measures
how well online decision-makers dispatch riders on a fixed road network.

- [Research plan (Japanese)](docs/benchmark_plan_jp.md)
- [Benchmark protocol v1](docs/benchmark-protocol.md)
- [Shared utility catalog](docs/shared-utils.md)
- [Development disciplines](CLAUDE.md)

## Development

Requires Node.js 22.19 or later and Yarn 1.

```sh
yarn install
yarn format
yarn build:packages
yarn typecheck
yarn lint
yarn build
yarn test
```

Packages live under `packages/` and export modules by subpath, for example
`@bus20/contracts/scenario`. Fixture maps and scenarios for tests live under
`datasets/fixtures/`; they are smoke-test inputs, not benchmark cases.

## Running a scenario offline

After `yarn build`, the runner CLI executes a scenario under the fixture
policy, scores it, verifies replay, and writes `run-log.json` and
`run-result.json` atomically:

```sh
node packages/runner/dist/src/cli.js run \
  --scenario datasets/fixtures/scenarios/smoke/smoke-01.json \
  --map datasets/fixtures/maps/grid3x3/v1/map.json \
  --out out/smoke-01
node packages/runner/dist/src/cli.js replay \
  --scenario datasets/fixtures/scenarios/smoke/smoke-01.json \
  --map datasets/fixtures/maps/grid3x3/v1/map.json \
  --log out/smoke-01/run-log.json
```

The fixture policy is a smoke-test baseline only. It is neither the Swift
reference nor an AI policy.
