import { actionSchema } from "@bus20/contracts/action";
import { parseJsonWithSchema } from "@bus20/contracts/json";
import { type Observation } from "@bus20/contracts/observation";
import { formatIssues } from "@bus20/contracts/result";
import { type Decision, type Policy } from "@bus20/simulator/policy";
import { z } from "zod";
import { JsonLinesClient } from "@bus20/transport/json-lines-client";

export const SWIFT_REFERENCE_POLICY_ID = "swift-insertion-reference" as const;
export const SWIFT_REFERENCE_TOOL_VERSION = "bus20-swift-reference/1" as const;
const DEFAULT_TIMEOUT_MS = 30_000;

const diagnosticsSchema = z.object({
  incrementalCostMs2: z.int().nonnegative(),
  candidatesEvaluated: z.int().nonnegative(),
  version: z.literal(SWIFT_REFERENCE_TOOL_VERSION),
});

/** Response line of the CLI. Validated at the boundary, never trusted. */
export const swiftResponseSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("action"), action: actionSchema, diagnostics: diagnosticsSchema }),
  z.object({ type: z.literal("error"), message: z.string() }),
]);

export interface SwiftReferenceOptions {
  /** Path to the built `bus20-baseline` executable. */
  readonly command: string;
  readonly timeoutMs?: number;
}

export interface SwiftReferencePolicy extends Policy {
  readonly close: () => void;
}

const toDecision = (line: string): Decision => {
  const parsed = parseJsonWithSchema(swiftResponseSchema, line);
  if (!parsed.ok) {
    throw new Error(`swift reference returned an invalid line: ${formatIssues(parsed.issues)}`);
  }
  if (parsed.value.type === "error") {
    throw new Error(`swift reference failed: ${parsed.value.message}`);
  }
  const { incrementalCostMs2, candidatesEvaluated } = parsed.value.diagnostics;
  return {
    action: parsed.value.action,
    usage: { swiftIncrementalCostMs2: incrementalCostMs2, candidatesEvaluated },
  };
};

/**
 * Connects the headless Swift insertion reference to the common policy
 * contract. The CLI keeps no clock or state; every decision is one request
 * line carrying the full observation.
 */
const DESCRIPTOR = {
  id: SWIFT_REFERENCE_POLICY_ID,
  kind: "swift-reference",
  toolVersion: SWIFT_REFERENCE_TOOL_VERSION,
} as const;

export const createSwiftReferencePolicy = (
  options: SwiftReferenceOptions,
): SwiftReferencePolicy => {
  const client = new JsonLinesClient({
    command: options.command,
    timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  });
  return {
    descriptor: DESCRIPTOR,
    decide: async (observation: Observation) => {
      const line = await client.request(JSON.stringify({ type: "decide", observation }));
      return toDecision(line);
    },
    close: () => {
      client.close();
    },
  };
};
