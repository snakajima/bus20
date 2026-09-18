import { type JsonValue } from "@bus20/contracts/json-value";

/** One option a decision-maker may pick, with a short structured description. */
export interface ChoiceOption {
  readonly id: string;
  readonly description: Readonly<Record<string, JsonValue>>;
}

/** One structured choice: shared state, a question, and the options in host order. */
export interface ChoiceRequest {
  readonly state: Readonly<Record<string, JsonValue>>;
  readonly question: string;
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
}
