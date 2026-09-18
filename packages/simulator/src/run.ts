import { digestDocument } from "@bus20/contracts/digest";
import { type MapDocument } from "@bus20/contracts/map";
import { type Observation } from "@bus20/contracts/observation";
import { type DecisionRecord, type RunLog, type RunTermination } from "@bus20/contracts/run-log";
import {
  type RideRequest,
  type ScenarioDocument,
  sortRequestsByRelease,
} from "@bus20/contracts/scenario";
import { type Stop } from "@bus20/contracts/stops";
import { PROTOCOL_VERSION, RUN_LOG_SCHEMA_VERSION } from "@bus20/contracts/versions";
import { enumerateCandidates } from "./candidates.js";
import {
  nextEventTimeMs,
  processArrivals,
  processDropoffs,
  processPickupsAndDepartures,
  releaseRequests,
} from "./events.js";
import { buildObservation } from "./observation.js";
import { type Decision, type Policy } from "./policy.js";
import { Routing } from "./routing.js";
import { stateDigest } from "./snapshot.js";
import {
  allRequestsCompleted,
  createInitialState,
  findVehicle,
  type SimulationState,
} from "./state.js";
import { type AcceptedPlan, validateAction } from "./validation.js";

export interface RunOptions {
  /** Upper bound on policy calls; exceeding it fails the run with `budgetExceeded`. */
  readonly maxDecisions?: number;
}

interface Host {
  readonly scenario: ScenarioDocument;
  readonly routing: Routing;
  readonly state: SimulationState;
  readonly policy: Policy;
  readonly options: RunOptions;
  readonly decisions: DecisionRecord[];
}

type Failed = Extract<RunTermination, { kind: "failed" }>;

type PolicyReply =
  | { readonly decision: Decision; readonly wallLatencyMs: number }
  | { readonly error: string; readonly wallLatencyMs: number };

const failNow = (host: Host, reason: Failed["reason"], detail: string): Failed => ({
  kind: "failed",
  finalTimeMs: host.state.nowMs,
  reason,
  detail,
});

const callPolicy = async (policy: Policy, observation: Observation): Promise<PolicyReply> => {
  const startedAt = performance.now();
  try {
    const decision = await policy.decide(observation);
    return { decision, wallLatencyMs: performance.now() - startedAt };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { error: message, wallLatencyMs: performance.now() - startedAt };
  }
};

const plainStop = (stop: Stop): Stop => ({
  requestId: stop.requestId,
  kind: stop.kind,
  nodeId: stop.nodeId,
});

const commit = (host: Host, request: RideRequest, plan: AcceptedPlan): void => {
  const vehicle = findVehicle(host.state, plan.vehicleId);
  const entry = host.state.requests.get(request.id);
  if (vehicle === undefined || entry === undefined) {
    throw new Error("simulator invariant: accepted plan names unknown vehicle or request");
  }
  vehicle.stops = plan.stops.map(plainStop);
  entry.phase = "assigned";
  entry.vehicleId = plan.vehicleId;
  host.state.stateVersion += 1;
};

const recordDecision = (
  host: Host,
  request: RideRequest,
  reply: Extract<PolicyReply, { decision: Decision }>,
  outcome: DecisionRecord["outcome"],
): void => {
  const { usage, trace } = reply.decision;
  host.decisions.push({
    stateVersion: host.state.stateVersion,
    nowMs: host.state.nowMs,
    requestId: request.id,
    action: reply.decision.action,
    outcome,
    wallLatencyMs: reply.wallLatencyMs,
    ...(usage === undefined ? {} : { usage }),
    ...(trace === undefined ? {} : { trace }),
  });
};

const budgetFailure = (host: Host): Failed | undefined => {
  const { maxDecisions } = host.options;
  return maxDecisions !== undefined && host.decisions.length >= maxDecisions
    ? failNow(host, "budgetExceeded", `decision budget of ${maxDecisions} exhausted`)
    : undefined;
};

const observe = (host: Host, request: RideRequest) => {
  const candidates = enumerateCandidates(host.routing, host.state, request);
  const { routing, state, scenario } = host;
  return {
    candidates,
    observation: buildObservation(routing, state, scenario.id, request.id, candidates),
  };
};

const applyReply = (
  host: Host,
  request: RideRequest,
  candidates: Parameters<typeof validateAction>[3],
  reply: Extract<PolicyReply, { decision: Decision }>,
): Failed | undefined => {
  const { routing, state } = host;
  const verdict = validateAction(routing, state, request, candidates, reply.decision.action);
  if (verdict.status === "rejected") {
    recordDecision(host, request, reply, verdict);
    return failNow(host, "invalidAction", `${verdict.reason}: ${verdict.detail}`);
  }
  recordDecision(host, request, reply, { status: "accepted" });
  commit(host, request, verdict);
  return undefined;
};

/** One decision: observe, ask the policy, validate, commit. Returns a failure or undefined. */
const decide = async (host: Host, request: RideRequest): Promise<Failed | undefined> => {
  const budget = budgetFailure(host);
  if (budget !== undefined) {
    return budget;
  }
  const { candidates, observation } = observe(host, request);
  const reply = await callPolicy(host.policy, observation);
  return "error" in reply
    ? failNow(host, "policyError", reply.error)
    : applyReply(host, request, candidates, reply);
};

const decideAll = async (
  host: Host,
  released: readonly RideRequest[],
): Promise<Failed | undefined> => {
  for (const request of released) {
    const failure = await decide(host, request);
    if (failure !== undefined) {
      return failure;
    }
  }
  return undefined;
};

interface StepResult {
  readonly failure?: Failed;
  readonly nextIndex: number;
}

/** Fixed same-timestamp order: arrivals, drop-offs, releases, decisions, pickups and departures. */
const step = async (
  host: Host,
  releases: readonly RideRequest[],
  releaseIndex: number,
): Promise<StepResult> => {
  processArrivals(host.state);
  processDropoffs(host.state);
  const { released, nextIndex } = releaseRequests(host.state, releases, releaseIndex);
  const failure = await decideAll(host, released);
  if (failure !== undefined) {
    return { failure, nextIndex };
  }
  processPickupsAndDepartures(host.routing, host.state);
  return { nextIndex };
};

const finish = (host: Host): RunTermination => {
  if (allRequestsCompleted(host.state)) {
    return { kind: "drained", finalTimeMs: host.state.nowMs };
  }
  const pending = [...host.state.requests.values()].filter((entry) => entry.phase !== "completed");
  return failNow(
    host,
    "deadlineExceeded",
    `${pending.length} request(s) unfinished at the completion deadline`,
  );
};

const loop = async (host: Host, releases: readonly RideRequest[]): Promise<RunTermination> => {
  let releaseIndex = 0;
  for (;;) {
    const nextTime = nextEventTimeMs(host.state, releases, releaseIndex);
    if (nextTime === undefined || nextTime > host.scenario.completionDeadlineMs) {
      return finish(host);
    }
    host.state.nowMs = nextTime;
    const result = await step(host, releases, releaseIndex);
    if (result.failure !== undefined) {
      return result.failure;
    }
    releaseIndex = result.nextIndex;
  }
};

const toRunLog = (host: Host, map: MapDocument, termination: RunTermination): RunLog => ({
  schemaVersion: RUN_LOG_SCHEMA_VERSION,
  protocolVersion: PROTOCOL_VERSION,
  scenarioId: host.scenario.id,
  scenarioDigest: digestDocument(host.scenario),
  mapDigest: digestDocument(map),
  policy: host.policy.descriptor,
  termination,
  journeys: host.state.journeys,
  decisions: host.decisions,
  finalStateDigest: stateDigest(host.state),
});

/**
 * Runs one scenario to completion under a policy. Virtual time only advances
 * between events; policy latency is recorded but never added to it.
 */
export const runSimulation = async (
  scenario: ScenarioDocument,
  map: MapDocument,
  policy: Policy,
  options: RunOptions = {},
): Promise<RunLog> => {
  const host: Host = {
    scenario,
    routing: new Routing(map),
    state: createInitialState(scenario),
    policy,
    options,
    decisions: [],
  };
  const termination = await loop(host, sortRequestsByRelease(scenario.requests));
  return toRunLog(host, map, termination);
};
