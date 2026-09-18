import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { JsonLinesClient } from "../src/json-lines-client.js";

const FAKE_CLI = path.join(import.meta.dirname, "fake-cli.js");

const client = (mode: string, timeoutMs = 2000): JsonLinesClient =>
  new JsonLinesClient({ command: process.execPath, args: [FAKE_CLI, mode], timeoutMs });

test("responses are matched to requests in order", async () => {
  const echo = client("echo");
  try {
    const [first, second] = await Promise.all([echo.request("one"), echo.request("two")]);
    assert.equal(first, JSON.stringify({ type: "echo", line: "one" }));
    assert.equal(second, JSON.stringify({ type: "echo", line: "two" }));
  } finally {
    echo.close();
  }
});

test("a crashing process rejects pending and later requests with its stderr", async () => {
  const crash = client("crash");
  await assert.rejects(crash.request("x"), /code 3.*fake cli crashed/s);
  await assert.rejects(crash.request("y"), /code 3/);
  crash.close();
});

test("a silent process times out", async () => {
  const silent = client("silent", 200);
  await assert.rejects(silent.request("x"), /no response within 200 ms/);
  silent.close();
});

test("a missing executable rejects instead of hanging", async () => {
  const missing = new JsonLinesClient({ command: "/nonexistent/bus20-baseline", timeoutMs: 2000 });
  await assert.rejects(missing.request("x"), /nonexistent/);
  missing.close();
});
