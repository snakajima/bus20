import { createFixturePolicy } from "@bus20/simulator/fixture-policy";
import { runSimulation } from "@bus20/simulator/run";
import assert from "node:assert/strict";
import { z } from "zod";
import { test } from "node:test";
import { compileProgram } from "../src/compile.js";
import { createProgramPolicy } from "../src/program-policy.js";
import { ProgramSandbox } from "../src/sandbox.js";
import { loadFixture, programFrom, SAMPLE_SOURCE } from "./helpers.js";

const LIMITS = { decisionTimeoutMs: 500, loadTimeoutMs: 500 };

const withPolicy = async <T>(
  source: string,
  body: (policy: ReturnType<typeof createProgramPolicy>) => Promise<T>,
): Promise<T> => {
  const policy = createProgramPolicy({
    program: programFrom(source),
    seed: 7,
    limits: { ...LIMITS, maxHeapMb: 128 },
  });
  try {
    return await body(policy);
  } finally {
    policy.close();
  }
};

test("compile rejects imports, host identifiers, dynamic code, and missing decide", () => {
  const cases: readonly [string, RegExp][] = [
    ['import fs from "node:fs"; function decide() {}', /imports and exports/],
    ["function decide() { return require('fs'); }", /"require" is not allowed/],
    ["function decide() { return process.env; }", /"process" is not allowed/],
    ["function decide() { return import('x'); }", /dynamic import/],
    ["function decide() { return globalThis; }", /"globalThis" is not allowed/],
    ["const decide = () => 1;", /top-level function decide/],
  ];
  for (const [source, pattern] of cases) {
    const result = compileProgram(source, "typescript");
    assert.equal(result.ok, false, source);
    assert.match(result.issues.map((issue) => issue.message).join("\n"), pattern);
  }
  assert.equal(compileProgram(SAMPLE_SOURCE, "typescript").ok, true);
});

test("sandbox exposes no host, seeds Math.random, freezes the clock, and enforces timeouts", () => {
  const probe = programFrom(
    "function decide(o: any) { return { types: [typeof fetch, typeof setTimeout, typeof console, typeof Buffer, typeof queueMicrotask], r: [Math.random(), Math.random()], now: Date.now() }; }",
  );
  const probeSchema = z.object({
    types: z.array(z.string()),
    now: z.number(),
    r: z.array(z.number()),
  });
  const first = new ProgramSandbox(probe.compiled, 3, LIMITS).decide({}).value;
  const second = new ProgramSandbox(probe.compiled, 3, LIMITS).decide({}).value;
  assert.deepEqual(first, second);
  const value = probeSchema.parse(first);
  assert.deepEqual(value.types, ["undefined", "undefined", "undefined", "undefined", "undefined"]);
  assert.equal(value.now, 0);
  assert.notDeepEqual(new ProgramSandbox(probe.compiled, 4, LIMITS).decide({}).value, first);

  const spin = programFrom("function decide() { while (true) {} }");
  assert.throws(() => new ProgramSandbox(spin.compiled, 1, LIMITS).decide({}), /timed out/i);
  const mutate = programFrom(
    "function decide(o: any) { o.candidates.push(1); return o.candidates.length; }",
  );
  const observation: { candidates: number[] } = { candidates: [] };
  assert.equal(new ProgramSandbox(mutate.compiled, 1, LIMITS).decide(observation).value, 1);
  assert.deepEqual(observation.candidates, []);
});

test("a program runs in its own process and matches the equivalent host policy", async () => {
  const { scenario, map } = loadFixture();
  const log = await withPolicy(SAMPLE_SOURCE, (policy) => runSimulation(scenario, map, policy));
  const reference = await runSimulation(scenario, map, createFixturePolicy());
  assert.equal(log.termination.kind, "drained");
  assert.equal(log.policy.kind, "generated-program");
  assert.equal(log.policy.settings?.["seed"], 7);
  assert.deepEqual(log.journeys, reference.journeys);
  assert.ok(log.decisions.every((decision) => (decision.usage?.["programCpuMs"] ?? -1) >= 0));
});

test("program errors, invalid actions, and timeouts fail the run as policyError", async () => {
  const { scenario, map } = loadFixture();
  const cases = [
    "function decide() { throw new Error('boom'); }",
    "function decide(o: any) { return { kind: 'chooseCandidate', candidateId: 'x' }; }",
    "function decide() { while (true) {} }",
  ];
  for (const source of cases) {
    const log = await withPolicy(source, (policy) => runSimulation(scenario, map, policy));
    assert.equal(log.termination.kind, "failed", source);
    assert.equal(log.termination.reason, "policyError", source);
  }
  const unknown =
    "function decide(o: any) { return { kind: 'chooseCandidate', schemaVersion: 'bus20-action/1', stateVersion: o.stateVersion, candidateId: 'nope' }; }";
  const log = await withPolicy(unknown, (policy) => runSimulation(scenario, map, policy));
  assert.equal(log.termination.kind === "failed" ? log.termination.reason : "", "invalidAction");
});
