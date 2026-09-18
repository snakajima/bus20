import {
  type EvaluationSummary,
  type PolicyProgram,
  type ProgramEvaluation,
} from "@bus20/contracts/policy-artifact";
import { seedFromLabel } from "@bus20/contracts/random";
import { type SuiteRun } from "@bus20/contracts/suite-index";
import { type LoadedSuite } from "@bus20/datasets/files";
import { createProgramPolicy, type ProgramLimits } from "@bus20/policy-runtime/program-policy";
import { type Logger } from "@bus20/runner/logging";
import { runSuite } from "@bus20/runner/suite";

export interface EvaluateRequest {
  readonly program: PolicyProgram;
  readonly suite: LoadedSuite;
  readonly split: string;
  readonly outDir: string;
  readonly campaignSeed: number;
  readonly limits?: Partial<ProgramLimits>;
  readonly logger: Logger;
}

const countReasons = (runs: readonly SuiteRun[]): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const run of runs) {
    if (run.failureReason !== null) {
      counts[run.failureReason] = (counts[run.failureReason] ?? 0) + 1;
    }
  }
  return counts;
};

export const summarizeRuns = (runs: readonly SuiteRun[]): EvaluationSummary => {
  const complete = runs.filter((run) => run.status === "complete");
  const pains = complete.flatMap((run) => (run.pain === null ? [] : [run.pain]));
  return {
    runs: runs.length,
    completeRuns: complete.length,
    successRate: runs.length === 0 ? 0 : complete.length / runs.length,
    conditionalMeanPain:
      pains.length === 0 ? null : pains.reduce((sum, value) => sum + value, 0) / pains.length,
    programCpuMs: runs.reduce((sum, run) => sum + run.programCpuMs, 0),
    failureReasons: countReasons(runs),
  };
};

/**
 * Runs a frozen program on one split. The program gets a fresh process per
 * scenario and a seed derived from the campaign seed and the program ID, so
 * the same program on the same split always yields the same log.
 */
const policyFactory = (request: EvaluateRequest) => {
  const seed = seedFromLabel(request.campaignSeed, `program:${request.program.id}`);
  return () => {
    const policy = createProgramPolicy({
      program: request.program,
      seed,
      ...(request.limits === undefined ? {} : { limits: request.limits }),
    });
    return { policy, close: policy.close };
  };
};

export const evaluateProgram = async (request: EvaluateRequest): Promise<ProgramEvaluation> => {
  const factory = policyFactory(request);
  const index = await runSuite({
    suite: request.suite,
    policies: [factory],
    splits: [request.split],
    repetitions: 1,
    outDir: request.outDir,
    logger: request.logger,
  });
  return {
    programId: request.program.id,
    benchmarkVersion: index.benchmarkVersion,
    manifestDigest: index.manifestDigest,
    split: request.split,
    summary: summarizeRuns(index.runs),
    runs: index.runs,
  };
};
