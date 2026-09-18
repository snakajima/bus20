#!/usr/bin/env node
import { parseJsonWithSchema } from "@bus20/contracts/json";
import { formatIssues } from "@bus20/contracts/result";
import { actionSchema } from "@bus20/contracts/action";
import { createInterface } from "node:readline";
import { type HostRequest, type HostResponse, hostRequestSchema } from "./host-protocol.js";
import { ProgramSandbox } from "./sandbox.js";

/**
 * Child process that hosts one generated program. It owns no clock and no
 * scenario data; the parent sends observations and validates every action
 * again before applying it. Memory is capped by the parent's node flags.
 */
let sandbox: ProgramSandbox | undefined;

const errorResponse = (error: unknown): HostResponse => ({
  type: "error",
  message: error instanceof Error ? error.message : String(error),
});

const handleLoad = (request: Extract<HostRequest, { type: "load" }>): HostResponse => {
  sandbox = new ProgramSandbox(request.compiled, request.seed, {
    decisionTimeoutMs: request.decisionTimeoutMs,
    loadTimeoutMs: request.loadTimeoutMs,
  });
  return { type: "ready" };
};

const handleDecide = (observation: unknown): HostResponse => {
  if (sandbox === undefined) {
    return { type: "error", message: "program not loaded" };
  }
  const outcome = sandbox.decide(observation);
  const action = actionSchema.safeParse(outcome.value);
  if (!action.success) {
    return {
      type: "error",
      message: `program returned an invalid action: ${action.error.message}`,
    };
  }
  return {
    type: "action",
    action: action.data,
    usage: { programCpuMs: outcome.cpuMs, heapUsedBytes: process.memoryUsage().heapUsed },
  };
};

const handle = (line: string): HostResponse => {
  const parsed = parseJsonWithSchema(hostRequestSchema, line);
  if (!parsed.ok) {
    return { type: "error", message: formatIssues(parsed.issues) };
  }
  try {
    return parsed.value.type === "load"
      ? handleLoad(parsed.value)
      : handleDecide(parsed.value.observation);
  } catch (error: unknown) {
    return errorResponse(error);
  }
};

createInterface({ input: process.stdin }).on("line", (line) => {
  if (line.trim() !== "") {
    process.stdout.write(`${JSON.stringify(handle(line))}\n`);
  }
});
