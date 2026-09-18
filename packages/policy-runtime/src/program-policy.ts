import { parseJsonWithSchema } from "@bus20/contracts/json";
import { type PolicyProgram } from "@bus20/contracts/policy-artifact";
import { formatIssues } from "@bus20/contracts/result";
import { type PolicyDescriptor } from "@bus20/contracts/run-log";
import { type Policy } from "@bus20/simulator/policy";
import { JsonLinesClient } from "@bus20/transport/json-lines-client";
import path from "node:path";
import { type HostRequest, hostResponseSchema } from "./host-protocol.js";

export const PROGRAM_RUNTIME_VERSION = "bus20-program-runtime/1" as const;

export interface ProgramLimits {
  readonly decisionTimeoutMs: number;
  readonly loadTimeoutMs: number;
  readonly maxHeapMb: number;
}

export const DEFAULT_PROGRAM_LIMITS: ProgramLimits = {
  decisionTimeoutMs: 2_000,
  loadTimeoutMs: 2_000,
  maxHeapMb: 256,
};

export interface ProgramPolicyOptions {
  readonly program: PolicyProgram;
  /** Seed the host gives the program's Math.random; recorded in the descriptor. */
  readonly seed: number;
  readonly limits?: Partial<ProgramLimits>;
}

export interface ProgramPolicy extends Policy {
  readonly close: () => void;
}

const HOST_ENTRY = path.join(import.meta.dirname, "program-host.js");
/** Generous wall timeout around the CPU timeout, so a hung child is still reported. */
const WALL_MARGIN_MS = 5_000;

const describe = (
  program: PolicyProgram,
  seed: number,
  limits: ProgramLimits,
): PolicyDescriptor => ({
  id: `program:${program.id}`,
  kind: "generated-program",
  provider: program.generator.provider,
  modelId: program.generator.modelId,
  promptVersion: program.generator.promptVersion,
  toolVersion: PROGRAM_RUNTIME_VERSION,
  settings: {
    programVersion: program.version,
    sourceDigest: program.sourceDigest,
    seed,
    decisionTimeoutMs: limits.decisionTimeoutMs,
    maxHeapMb: limits.maxHeapMb,
  },
});

const send = async (client: JsonLinesClient, request: HostRequest) => {
  const line = await client.request(JSON.stringify(request));
  const parsed = parseJsonWithSchema(hostResponseSchema, line);
  if (!parsed.ok) {
    throw new Error(`program host returned an invalid line: ${formatIssues(parsed.issues)}`);
  }
  if (parsed.value.type === "error") {
    throw new Error(`program failed: ${parsed.value.message}`);
  }
  return parsed.value;
};

/**
 * Runs a frozen program in its own node process with a heap cap and a CPU
 * timeout per decision. The program sees only the observation; the host
 * never trusts its output without validation.
 */
const spawnHost = (limits: ProgramLimits): JsonLinesClient =>
  new JsonLinesClient({
    command: process.execPath,
    args: [`--max-old-space-size=${limits.maxHeapMb}`, HOST_ENTRY],
    timeoutMs: Math.max(limits.decisionTimeoutMs, limits.loadTimeoutMs) + WALL_MARGIN_MS,
  });

const loadRequest = (options: ProgramPolicyOptions, limits: ProgramLimits): HostRequest => ({
  type: "load",
  compiled: options.program.compiled,
  seed: options.seed,
  decisionTimeoutMs: limits.decisionTimeoutMs,
  loadTimeoutMs: limits.loadTimeoutMs,
});

const decideVia = async (
  client: JsonLinesClient,
  loaded: Promise<unknown>,
  observation: unknown,
) => {
  await loaded;
  const reply = await send(client, { type: "decide", observation });
  if (reply.type !== "action") {
    throw new Error("program host did not return an action");
  }
  return { action: reply.action, usage: reply.usage };
};

export const createProgramPolicy = (options: ProgramPolicyOptions): ProgramPolicy => {
  const limits = { ...DEFAULT_PROGRAM_LIMITS, ...options.limits };
  const client = spawnHost(limits);
  const loaded = send(client, loadRequest(options, limits));
  return {
    descriptor: describe(options.program, options.seed, limits),
    decide: (observation) => decideVia(client, loaded, observation),
    close: () => {
      client.close();
    },
  };
};
