import { type MapDocument, validateMapDocument } from "@bus20/contracts/map";
import { type ScenarioDocument, validateScenarioDocument } from "@bus20/contracts/scenario";
import { readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";

// Tests run from dist/test, four levels below the repository root.
const REPO_ROOT = path.resolve(import.meta.dirname, "../../../..");
const FIXTURES = path.join(REPO_ROOT, "datasets/fixtures");

const readJson = (relative: string): unknown =>
  JSON.parse(readFileSync(path.join(FIXTURES, relative), "utf8"));

export const loadFixture = (): { scenario: ScenarioDocument; map: MapDocument } => {
  const map = validateMapDocument(readJson("maps/grid3x3/v1/map.json"));
  const scenario = validateScenarioDocument(readJson("scenarios/smoke/smoke-01.json"));
  if (!map.ok || !scenario.ok) {
    throw new Error("fixture is invalid");
  }
  return { scenario: scenario.value, map: map.value };
};

export interface CapturedRequest {
  readonly url: string;
  readonly headers: Record<string, string>;
  readonly body: unknown;
}

export type FakeFetch = typeof fetch & { readonly requests: CapturedRequest[] };

const headersOf = (init: RequestInit | undefined): Record<string, string> => {
  const out: Record<string, string> = {};
  new Headers(init?.headers).forEach((value, key) => {
    out[key] = value;
  });
  return out;
};

/**
 * A fetch that never touches the network. `respond` receives the parsed JSON
 * body and returns the JSON the API would answer with, or a Response for
 * error cases.
 */
export const fakeFetch = (respond: (request: CapturedRequest) => unknown): FakeFetch => {
  const requests: CapturedRequest[] = [];
  const impl = (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const bodyText = typeof init?.body === "string" ? init.body : "";
    const request: CapturedRequest = {
      url,
      headers: headersOf(init),
      body: bodyText === "" ? undefined : JSON.parse(bodyText),
    };
    requests.push(request);
    const reply = respond(request);
    if (reply instanceof Response) {
      return Promise.resolve(reply);
    }
    return Promise.resolve(
      new Response(JSON.stringify(reply), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
  };
  return Object.assign(impl, { requests });
};

/** Shape of the systemOne request the Jev adapter must send. */
export const jevRequestSchema = z.object({
  model: z.string(),
  state: z.record(z.string(), z.unknown()),
  questions: z.object({
    candidate: z.object({
      type: z.literal("choice"),
      instructions: z.string(),
      criteria: z.record(z.string(), z.unknown()),
    }),
  }),
});

/** Shape of the Messages API request the Claude adapter must send. */
export const claudeRequestSchema = z.object({
  model: z.string(),
  max_tokens: z.int(),
  system: z.string(),
  messages: z.array(z.object({ role: z.literal("user"), content: z.string() })).length(1),
  output_config: z.object({
    effort: z.string(),
    format: z.object({
      type: z.literal("json_schema"),
      schema: z.object({
        properties: z.object({ candidateId: z.object({ enum: z.array(z.string()) }) }),
      }),
    }),
  }),
});

export const claudeMessage = (text: string, overrides: Record<string, unknown> = {}): unknown => ({
  id: "msg_test",
  type: "message",
  role: "assistant",
  model: "claude-opus-5",
  content: [{ type: "text", text }],
  stop_reason: "end_turn",
  stop_sequence: null,
  usage: { input_tokens: 1200, output_tokens: 20, cache_read_input_tokens: 200 },
  ...overrides,
});

const briefCandidateSchema = z.object({
  id: z.string(),
  stops: z.array(z.object({ requestId: z.string(), kind: z.string(), arrivalMinutes: z.number() })),
});

const briefSchema = z.object({
  decisionRequestId: z.string(),
  candidates: z.array(briefCandidateSchema),
});

/** A deterministic stand-in for a model: the candidate that picks the new passenger up soonest. */
export const earliestPickupFromBrief = (brief: unknown): string => {
  const parsed = briefSchema.parse(brief);
  const pickupMinutes = (candidate: z.infer<typeof briefCandidateSchema>): number =>
    candidate.stops.find(
      (stop) => stop.requestId === parsed.decisionRequestId && stop.kind === "pickup",
    )?.arrivalMinutes ?? Number.POSITIVE_INFINITY;
  const best = parsed.candidates.reduce<z.infer<typeof briefCandidateSchema> | undefined>(
    (chosen, candidate) =>
      chosen === undefined || pickupMinutes(candidate) < pickupMinutes(chosen) ? candidate : chosen,
    undefined,
  );
  if (best === undefined) {
    throw new Error("no candidates in brief");
  }
  return best.id;
};
