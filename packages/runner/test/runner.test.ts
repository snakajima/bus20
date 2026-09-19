import { runLogSchema } from "@bus20/contracts/run-log";
import { runResultSchema } from "@bus20/contracts/run-result";
import { suiteIndexSchema } from "@bus20/contracts/suite-index";
import { compileProgram } from "@bus20/policy-runtime/compile";
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
import { createPolicyById, loadInputs, replayStoredLog, runAndScore } from "../src/run-scenario.js";

// Tests run from dist/test, four levels below the repository root.
const REPO_ROOT = path.resolve(import.meta.dirname, "../../../..");
const SCENARIO = path.join(REPO_ROOT, "datasets/fixtures/scenarios/smoke/smoke-01.json");
const MAP = path.join(REPO_ROOT, "datasets/fixtures/maps/grid3x3/v1/map.json");
const CLI = path.join(REPO_ROOT, "packages/runner/dist/src/cli.js");
const ANALYZE_CLI = path.join(REPO_ROOT, "packages/analysis/dist/src/cli.js");

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

test("compare command tabulates run directories and writes markdown", async () => {
  const inputs = await loadInputs(SCENARIO, MAP);
  assert.ok(inputs.ok);
  const outDir = tempDir();
  await runAndScore({
    inputs: inputs.value,
    policy: createFixturePolicy(),
    outDir,
    logger: silentLogger,
  });
  const markdownPath = path.join(outDir, "table.md");
  const compare = spawnSync(
    process.execPath,
    [CLI, "compare", outDir, "--markdown", markdownPath],
    {
      encoding: "utf8",
    },
  );
  assert.equal(compare.status, 0, compare.stderr);
  const rows: unknown = JSON.parse(compare.stdout);
  const parsed = z
    .object({
      rows: z.array(
        z.object({
          policyId: z.string(),
          status: z.literal("complete"),
          pain: z.number(),
          completedCount: z.literal(12),
          costUsd: z.null(),
        }),
      ),
    })
    .safeParse(rows);
  assert.ok(parsed.success);
  const table = readFileSync(markdownPath, "utf8");
  assert.match(table, /^\| policy \| kind \| model/);
  assert.match(
    table,
    /fixture-append-earliest-pickup \| fixture \| n\/a \| smoke-01 \| complete \| 67\.73 \| 12\/12/,
  );
  const empty = spawnSync(process.execPath, [CLI, "compare"], { encoding: "utf8" });
  assert.equal(empty.status, 2);
});

test("the rollout reference binds to the scenario's map", async () => {
  const inputs = await loadInputs(SCENARIO, MAP);
  assert.ok(inputs.ok);
  const rollout = createPolicyById("rollout", {
    inputs: inputs.value,
    rollout: { demand: "empirical", samples: 4 },
  });
  assert.ok(rollout !== undefined);
  assert.equal(rollout.policy.descriptor.kind, "rollout-reference");
  assert.equal(rollout.policy.descriptor.id, "rollout-reference:empirical:k8:s4:h10");
  // The default is the known distribution; the hand-written smoke fixture has none.
  assert.throws(
    () => createPolicyById("rollout", { inputs: inputs.value }),
    /no generator provenance/,
  );
  assert.equal(createPolicyById("rollout"), undefined, "the rollout reference needs a map");
});

test("model policies are selectable and an invalid effort is a usage error", () => {
  process.env["ANTHROPIC_API_KEY"] = "test";
  process.env["OPENAI_API_KEY"] = "test";
  process.env["GEMINI_API_KEY"] = "test";
  process.env["TYPESAFE_API_KEY"] = "test";
  const claude = createPolicyById("claude", { modelId: "claude-sonnet-5", effort: "low" });
  assert.ok(claude !== undefined);
  assert.equal(claude.policy.descriptor.kind, "general-llm");
  assert.equal(claude.policy.descriptor.modelId, "claude-sonnet-5");
  const openai = createPolicyById("openai", { effort: "low" });
  assert.ok(openai !== undefined);
  assert.equal(openai.policy.descriptor.provider, "openai");
  assert.equal(openai.policy.descriptor.modelId, "gpt-5.6-sol");
  const gemini = createPolicyById("gemini", { effort: "low" });
  assert.ok(gemini !== undefined);
  assert.equal(gemini.policy.descriptor.provider, "google");
  assert.equal(gemini.policy.descriptor.modelId, "gemini-3.8-flash");
  const jev = createPolicyById("jev");
  assert.ok(jev !== undefined);
  assert.equal(jev.policy.descriptor.kind, "jev");
  assert.equal(jev.policy.descriptor.modelId, "jev-1.13.0");
  delete process.env["TYPESAFE_API_KEY"];
  assert.throws(() => createPolicyById("jev"), /TYPESAFE_API_KEY/);
  assert.equal(createPolicyById("nope"), undefined);
  const outDir = tempDir();
  const bad = spawnSync(
    process.execPath,
    [
      CLI,
      "run",
      "--policy",
      "claude",
      "--effort",
      "silly",
      "--scenario",
      SCENARIO,
      "--map",
      MAP,
      "--out",
      outDir,
    ],
    { encoding: "utf8", env: { ...process.env, ANTHROPIC_API_KEY: "test" } },
  );
  assert.equal(bad.status, 2);
  const env = { ...process.env };
  delete env["TYPESAFE_API_KEY"];
  const noKey = spawnSync(
    process.execPath,
    [CLI, "run", "--policy", "jev", "--scenario", SCENARIO, "--map", MAP, "--out", outDir],
    { encoding: "utf8", env },
  );
  assert.equal(noKey.status, 2);
  assert.match(noKey.stderr, /TYPESAFE_API_KEY/);
});

test("suite runs every policy on every selected scenario, resumes, and analyzes", () => {
  const manifestPath = path.join(REPO_ROOT, "datasets/synthetic-dev-1/manifest.json");
  const outDir = tempDir();
  const args = [
    CLI,
    "suite",
    "--manifest",
    manifestPath,
    "--policies",
    "fixture",
    "--splits",
    "dev",
    "--limit",
    "2",
    "--out",
    outDir,
  ];
  const first = spawnSync(process.execPath, args, { encoding: "utf8" });
  assert.equal(first.status, 0, first.stderr);
  const indexPath = path.join(outDir, "suite-index.json");
  const index = suiteIndexSchema.parse(JSON.parse(readFileSync(indexPath, "utf8")));
  assert.equal(index.runs.length, 2);
  assert.ok(index.runs.every((run) => run.policy.kind === "fixture" && run.replayMatches));
  const second = spawnSync(process.execPath, args, { encoding: "utf8" });
  assert.equal(second.status, 0, second.stderr);
  assert.equal((second.stderr.match(/suite\.reuse/g) ?? []).length, 2);
  const analyze = spawnSync(
    process.execPath,
    [
      ANALYZE_CLI,
      "--suite-index",
      indexPath,
      "--reference",
      "fixture-append-earliest-pickup",
      "--out",
      path.join(outDir, "analysis"),
    ],
    { encoding: "utf8" },
  );
  assert.equal(analyze.status, 0, analyze.stderr);
  assert.ok(existsSync(path.join(outDir, "analysis", "analysis.md")));
});

test("a frozen program artifact runs through --policy program and matches the fixture policy", async () => {
  const source = readFileSync(
    path.join(REPO_ROOT, "packages/policy-runtime/test/fixtures/append-earliest.ts.txt"),
    "utf8",
  );
  const compiled = compileProgram(source, "typescript");
  assert.ok(compiled.ok);
  const outDir = tempDir();
  const programPath = path.join(outDir, "program.json");
  await writeJsonAtomic(programPath, {
    schemaVersion: "bus20-policy-program/1",
    id: "sample",
    campaignId: "manual",
    version: 0,
    parentId: null,
    origin: "initial",
    language: "typescript",
    source,
    compiled: compiled.value,
    compileError: null,
    sourceDigest: `sha256:${"a".repeat(64)}`,
    generator: { provider: "manual", modelId: "none", promptVersion: "none" },
    spend: { inputTokens: 0, outputTokens: 0, costUsd: null, wallMs: 0 },
  });
  const run = spawnSync(
    process.execPath,
    [
      CLI,
      "run",
      "--policy",
      "program",
      "--program",
      programPath,
      "--scenario",
      SCENARIO,
      "--map",
      MAP,
      "--out",
      path.join(outDir, "run"),
    ],
    { encoding: "utf8" },
  );
  assert.equal(run.status, 0, run.stderr);
  const log = runLogSchema.parse(
    JSON.parse(readFileSync(path.join(outDir, "run", "run-log.json"), "utf8")),
  );
  assert.equal(log.policy.kind, "generated-program");
  const fixture = spawnSync(
    process.execPath,
    [CLI, "run", "--scenario", SCENARIO, "--map", MAP, "--out", path.join(outDir, "fixture")],
    { encoding: "utf8" },
  );
  assert.equal(fixture.status, 0);
  const reference = runLogSchema.parse(
    JSON.parse(readFileSync(path.join(outDir, "fixture", "run-log.json"), "utf8")),
  );
  assert.deepEqual(log.journeys, reference.journeys);
});
