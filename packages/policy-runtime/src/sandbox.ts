import { createRng } from "@bus20/contracts/random";
import vm from "node:vm";
import { DECIDE_FUNCTION } from "./compile.js";

export interface SandboxLimits {
  /** CPU-bound timeout for one decision, in milliseconds. */
  readonly decisionTimeoutMs: number;
  /** Timeout for loading the program, in milliseconds. */
  readonly loadTimeoutMs: number;
}

export interface DecisionOutcome {
  readonly value: unknown;
  readonly cpuMs: number;
}

const OBSERVATION_SLOT = "__observation";

/** vm returns `any`; pin it to unknown at the boundary. */
const runUnknown = (code: string, context: vm.Context, options: vm.RunningScriptOptions): unknown =>
  vm.runInContext(code, context, options);

const cloneJson = (value: unknown): unknown => JSON.parse(JSON.stringify(value ?? null));

/**
 * Builds the frozen global scope a program sees: the ECMAScript intrinsics
 * of a fresh context, a seeded `Math.random`, a constant clock, and nothing
 * from Node. No `require`, `process`, `fetch`, timers, or console.
 */
const createContext = (seed: number): vm.Context => {
  // V8 gives every context a console intrinsic; shadow it so programs cannot write output.
  const context = vm.createContext(
    { console: undefined },
    { codeGeneration: { strings: false, wasm: false } },
  );
  const rng = createRng(seed);
  vm.runInContext(
    `Math.random = () => __nextRandom(); Date.now = () => 0; Object.freeze(Math);`,
    Object.assign(context, { __nextRandom: () => rng.next() }),
  );
  return context;
};

/**
 * One loaded program. Each `decide` call runs synchronously under a CPU
 * timeout; the observation is passed as a JSON clone so the program cannot
 * touch host objects.
 */
export class ProgramSandbox {
  private readonly context: vm.Context;

  constructor(
    compiled: string,
    seed: number,
    private readonly limits: SandboxLimits,
  ) {
    this.context = createContext(seed);
    new vm.Script(compiled, { filename: "program.js" }).runInContext(this.context, {
      timeout: limits.loadTimeoutMs,
    });
    if (vm.runInContext(`typeof ${DECIDE_FUNCTION}`, this.context) !== "function") {
      throw new Error(`program did not define function ${DECIDE_FUNCTION}`);
    }
  }

  decide(observation: unknown): DecisionOutcome {
    this.context[OBSERVATION_SLOT] = cloneJson(observation);
    const before = process.cpuUsage();
    try {
      const value = runUnknown(`${DECIDE_FUNCTION}(${OBSERVATION_SLOT})`, this.context, {
        timeout: this.limits.decisionTimeoutMs,
      });
      const usage = process.cpuUsage(before);
      return { value: cloneJson(value), cpuMs: (usage.user + usage.system) / 1000 };
    } finally {
      this.context[OBSERVATION_SLOT] = undefined;
    }
  }
}
