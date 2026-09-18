import { runLogSchema } from "@bus20/contracts/run-log";
import { runResultSchema } from "@bus20/contracts/run-result";
import { createFixturePolicy } from "@bus20/simulator/fixture-policy";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { z } from "zod";
import { readJsonFile, writeJsonAtomic } from "../src/files.js";
import { silentLogger } from "../src/logging.js";
import { loadInputs, replayStoredLog, runAndScore } from "../src/run-scenario.js";

// Tests run from dist/test, four levels below the repository root.
const REPO_ROOT = path.resolve(import.meta.dirname, "../../../..");
const SCENARIO = path.join(REPO_ROOT, "datasets/fixtures/scenarios/smoke/smoke-01.json");
const MAP = path.join(REPO_ROOT, "datasets/fixtures/maps/grid3x3/v1/map.json");
const CLI = path.join(REPO_ROOT, "packages/runner/dist/src/cli.js");

const SWIFT_CLI =
  process.env["BUS20_SWIFT_CLI"] ??
  ["release", "debug"]
    .map((config) => path.join(REPO_ROOT, "swift/.build", config, "bus20-baseline"))
    .find((candidate) => existsSync(candidate));

const tempDir = (): string => mkdtempSync(path.join(tmpdir(), "bus20-runner-"));

test("writeJsonAtomic leaves no temporary file and readJsonFile validates", async () => {
  const dir = tempDir();
  const file = path.join(dir, "nested", "doc.json");
  await writeJsonAtomic(file, { b: 1, a: [1, 2] });
  assert.deepEqual(readdirSync(path.dirname(file)), ["doc.json"]);
  const good = await readJsonFile(file, z.object({ a: z.array(z.int()), b: z.int() }));
  assert.deepEqual(good, { ok: true, value: { a: [1, 2], b: 1 } });
  const missing = await readJsonFile(path.join(dir, "nope.json"), z.object({}));
  assert.equal(missing.ok, false);
});

test("runAndScore writes a valid log and result and verifies replay", async () => {
  const inputs = await loadInputs(SCENARIO, MAP);
  assert.equal(inputs.ok, true);
  const outDir = tempDir();
  const summary = await runAndScore({
    inputs: inputs.value,
    policy: createFixturePolicy(),
    outDir,
    logger: silentLogger,
  });
  assert.equal(summary.result.status, "complete");
  assert.equal(summary.replay.matches, true);
  const log = await readJsonFile(summary.logPath, runLogSchema);
  const result = await readJsonFile(summary.resultPath, runResultSchema);
  assert.equal(log.ok, true);
  assert.equal(result.ok, true);
  assert.equal(log.value.journeys.length, 12);
  assert.equal(log.value.policy.kind, "fixture");
  const replay = await replayStoredLog(inputs.value, summary.logPath);
  assert.equal(replay.ok && replay.value.matches, true);
});

test("loadInputs reports semantic problems across scenario and map", async () => {
  const wrongMap = await loadInputs(SCENARIO, path.join(REPO_ROOT, "package.json"));
  assert.equal(wrongMap.ok, false);
  assert.ok(wrongMap.issues.length > 0);
});

test("CLI run and replay succeed on the fixture; bad usage exits 2", () => {
  const outDir = tempDir();
  const run = spawnSync(
    process.execPath,
    [CLI, "run", "--scenario", SCENARIO, "--map", MAP, "--out", outDir],
    {
      encoding: "utf8",
    },
  );
  assert.equal(run.status, 0, run.stderr);
  const summary: unknown = JSON.parse(run.stdout);
  assert.equal(
    z.object({ status: z.literal("complete"), replayMatches: z.literal(true) }).safeParse(summary)
      .success,
    true,
  );
  assert.ok(existsSync(path.join(outDir, "run-log.json")));
  assert.ok(run.stderr.split("\n").every((line) => line === "" || line.startsWith("{")));

  const replay = spawnSync(
    process.execPath,
    [
      CLI,
      "replay",
      "--scenario",
      SCENARIO,
      "--map",
      MAP,
      "--log",
      path.join(outDir, "run-log.json"),
    ],
    { encoding: "utf8" },
  );
  assert.equal(replay.status, 0, replay.stderr);
  assert.match(replay.stdout, /"replayMatches":true/);

  const usage = spawnSync(process.execPath, [CLI, "run"], { encoding: "utf8" });
  assert.equal(usage.status, 2);
  assert.match(usage.stderr, /^usage:/);
  assert.equal(
    readFileSync(path.join(outDir, "run-result.json"), "utf8").includes('"pain": null'),
    false,
  );
});

test("CLI runs the Swift reference and records its policy kind", () => {
  if (SWIFT_CLI === undefined) {
    throw new Error("Swift CLI not built: run `yarn build:swift` (or set BUS20_SWIFT_CLI)");
  }
  const outDir = tempDir();
  const args = [
    CLI,
    "run",
    "--policy",
    "swift",
    "--swift-cli",
    SWIFT_CLI,
    "--scenario",
    SCENARIO,
    "--map",
    MAP,
    "--out",
    outDir,
  ];
  const run = spawnSync(process.execPath, args, { encoding: "utf8" });
  assert.equal(run.status, 0, run.stderr);
  const log: unknown = JSON.parse(readFileSync(path.join(outDir, "run-log.json"), "utf8"));
  const parsed = runLogSchema.safeParse(log);
  assert.ok(parsed.success);
  assert.equal(parsed.data.policy.kind, "swift-reference");
  assert.equal(parsed.data.policy.toolVersion, "bus20-swift-reference/1");
  const missing = spawnSync(
    process.execPath,
    [CLI, "run", "--policy", "swift", "--scenario", SCENARIO, "--map", MAP, "--out", outDir],
    {
      encoding: "utf8",
      env: { ...process.env, BUS20_SWIFT_CLI: "" },
    },
  );
  assert.equal(missing.status, 2);
});
