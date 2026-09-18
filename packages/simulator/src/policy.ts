import { type Action } from "@bus20/contracts/action";
import { type JsonValue } from "@bus20/contracts/json-value";
import { type Observation } from "@bus20/contracts/observation";
import { type PolicyDescriptor } from "@bus20/contracts/run-log";

/** Optional accounting a policy reports for one decision (tokens, cost, tool calls). */
export type DecisionUsage = Readonly<Record<string, number>>;

export interface Decision {
  readonly action: Action;
  readonly usage?: DecisionUsage;
  /** Provider material (request digest, raw response) for reproducibility. */
  readonly trace?: Readonly<Record<string, JsonValue>>;
}

/**
 * The common decision contract. The host builds the observation and the
 * candidate set; the policy returns one action. Calls never advance virtual
 * time, and wall-clock latency is measured by the host.
 */
export interface Policy {
  readonly descriptor: PolicyDescriptor;
  decide: (observation: Observation) => Promise<Decision>;
}
