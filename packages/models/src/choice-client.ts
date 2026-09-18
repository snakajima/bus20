import { type JsonValue } from "@bus20/contracts/json-value";

/** One option a decision-maker may pick, with a short structured description. */
export interface ChoiceOption {
  readonly id: string;
  readonly description: Readonly<Record<string, JsonValue>>;
}

/** One structured choice: shared state, a question, and the options in host order. */
export interface ChoiceRequest {
  readonly state: Readonly<Record<string, JsonValue>>;
  /** A sentence, or a structured instruction object for models trained on structure. */
  readonly question: string | Readonly<Record<string, JsonValue>>;
  readonly options: readonly ChoiceOption[];
}

export interface ChoiceReply {
  readonly choice: string;
  /** Numeric accounting for this call: tokens, cost, confidence. */
  readonly usage: Readonly<Record<string, number>>;
  readonly trace: Readonly<Record<string, JsonValue>>;
}

/**
 * The narrow contract every model adapter implements: answer one structured
 * choice. Decision procedures (flat, hierarchical) compose these calls.
 */
export interface ChoiceClient {
  readonly ask: (request: ChoiceRequest) => Promise<ChoiceReply>;
  /**
   * Several independent choices over the same state in one round trip, when
   * the provider supports it (Jev scores questions independently within one
   * call). Absent, the procedure asks them one by one.
   */
  readonly askMany?: (requests: readonly ChoiceRequest[]) => Promise<ChoiceReply[]>;
}

/** Runs `askMany` when available, otherwise sequential `ask` calls. */
export const askAll = (
  client: ChoiceClient,
  requests: readonly ChoiceRequest[],
): Promise<ChoiceReply[]> =>
  client.askMany === undefined
    ? requests.reduce<Promise<ChoiceReply[]>>(
        async (previous, request) => [...(await previous), await client.ask(request)],
        Promise.resolve([]),
      )
    : client.askMany(requests);
