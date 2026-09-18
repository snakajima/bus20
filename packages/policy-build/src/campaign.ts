import { digestDocument } from "@bus20/contracts/digest";
import {
  type Budget,
  type Campaign,
  type CampaignMode,
  type EvaluationSummary,
  type PolicyProgram,
  type ProgramEvaluation,
  type SpendTotals,
} from "@bus20/contracts/policy-artifact";
import { CAMPAIGN_SCHEMA_VERSION, POLICY_PROGRAM_SCHEMA_VERSION } from "@bus20/contracts/versions";
import { type LoadedSuite } from "@bus20/datasets/files";
import { compileProgram } from "@bus20/policy-runtime/compile";
import { type ProgramLimits } from "@bus20/policy-runtime/program-policy";
import { type Logger } from "@bus20/runner/logging";
import {
  readCampaign,
  readEvaluation,
  readProgram,
  runsDir,
  writeCampaign,
  writeEvaluation,
  writeProgram,
} from "./artifacts.js";
import { evaluateProgram } from "./evaluate.js";
import { buildFeedback } from "./feedback.js";
import { type GenerationInput, type GenerationOutput, type ProgramGenerator } from "./generator.js";
import { compareForSelection, isImprovement } from "./selection.js";

export interface CampaignRequest {
  readonly id: string;
  readonly mode: CampaignMode;
  readonly suite: LoadedSuite;
  readonly devSplit: string;
  readonly validationSplit: string;
  readonly seed: number;
  readonly budget: Budget;
  readonly generator: ProgramGenerator;
  readonly outDir: string;
  readonly limits?: Partial<ProgramLimits>;
  /** Cities held out of development and validation; the test split still includes them. */
  readonly excludeCities?: readonly string[];
  readonly logger: Logger;
}

interface State {
  readonly request: CampaignRequest;
  campaign: Campaign;
  programs: PolicyProgram[];
  /** Accepted lineage head for B-self; every accepted program is a selection candidate. */
  incumbent: { program: PolicyProgram; summary: EvaluationSummary } | undefined;
}

const ZERO_SPEND: SpendTotals = {
  generations: 0,
  evaluations: 0,
  inputTokens: 0,
  outputTokens: 0,
  costUsd: 0,
  programCpuMs: 0,
};

const initialCampaign = (request: CampaignRequest): Campaign => ({
  schemaVersion: CAMPAIGN_SCHEMA_VERSION,
  id: request.id,
  mode: request.mode,
  benchmarkVersion: request.suite.manifest.benchmarkVersion,
  manifestDigest: digestDocument(request.suite.manifest),
  devSplit: request.devSplit,
  validationSplit: request.validationSplit,
  seed: request.seed,
  excludeCities: [...(request.excludeCities ?? [])],
  budget: request.budget,
  spent: ZERO_SPEND,
  iterations: [],
  selectedProgramId: null,
  frozen: false,
  stopReason: null,
});

const budgetExhausted = (campaign: Campaign): string | undefined => {
  const { budget, spent } = campaign;
  if (spent.generations >= budget.maxGenerations) {
    return "generation budget exhausted";
  }
  if (spent.evaluations >= budget.maxEvaluations) {
    return "evaluation budget exhausted";
  }
  if (budget.maxCostUsd !== null && spent.costUsd >= budget.maxCostUsd) {
    return "cost budget exhausted";
  }
  return undefined;
};

const originOf = (input: GenerationInput): PolicyProgram["origin"] => {
  if (input.kind === "revision") {
    return "revision";
  }
  return input.attempt === 0 ? "initial" : "restart";
};

const compiledFields = (
  output: GenerationOutput,
): Pick<PolicyProgram, "compiled" | "compileError"> => {
  const compiled = compileProgram(output.source, output.language);
  return compiled.ok
    ? { compiled: compiled.value, compileError: null }
    : { compiled: "", compileError: compiled.issues.map((issue) => issue.message).join("; ") };
};

const toProgram = (
  state: State,
  output: GenerationOutput,
  input: GenerationInput,
  parent: PolicyProgram | undefined,
): PolicyProgram => {
  const version = state.programs.length;
  return {
    schemaVersion: POLICY_PROGRAM_SCHEMA_VERSION,
    id: `${state.request.id}-v${String(version).padStart(3, "0")}`,
    campaignId: state.request.id,
    version,
    parentId: parent?.id ?? null,
    origin: originOf(input),
    ...sourceFields(output),
    ...compiledFields(output),
  };
};

const sourceFields = (
  output: GenerationOutput,
): Pick<
  PolicyProgram,
  "language" | "source" | "sourceDigest" | "generator" | "spend" | "trace"
> => ({
  language: output.language,
  source: output.source,
  sourceDigest: digestDocument(output.source),
  generator: {
    provider: output.provider,
    modelId: output.modelId,
    promptVersion: output.promptVersion,
  },
  spend: output.spend,
  trace: output.trace,
});

const spend = (state: State, delta: Partial<SpendTotals>): void => {
  state.campaign = { ...state.campaign, spent: addSpend(state.campaign.spent, delta) };
};

const addSpend = (spent: SpendTotals, delta: Partial<SpendTotals>): SpendTotals => ({
  generations: spent.generations + (delta.generations ?? 0),
  evaluations: spent.evaluations + (delta.evaluations ?? 0),
  inputTokens: spent.inputTokens + (delta.inputTokens ?? 0),
  outputTokens: spent.outputTokens + (delta.outputTokens ?? 0),
  costUsd: spent.costUsd + (delta.costUsd ?? 0),
  programCpuMs: spent.programCpuMs + (delta.programCpuMs ?? 0),
});

const generate = async (
  state: State,
  input: GenerationInput,
  parent: PolicyProgram | undefined,
): Promise<PolicyProgram> => {
  const output = await state.request.generator.generate(input);
  const program = toProgram(state, output, input, parent);
  state.programs.push(program);
  await writeProgram(state.request.outDir, program);
  const { inputTokens, outputTokens, costUsd } = output.spend;
  spend(state, { generations: 1, inputTokens, outputTokens, costUsd: costUsd ?? 0 });
  return program;
};

const evaluate = async (
  state: State,
  program: PolicyProgram,
  split: string,
): Promise<ProgramEvaluation> => {
  const evaluation = await evaluateProgram({
    program,
    suite: state.request.suite,
    split,
    outDir: runsDir(state.request.outDir, program.id, split),
    campaignSeed: state.request.seed,
    ...(state.request.limits === undefined ? {} : { limits: state.request.limits }),
    excludeCities: state.request.excludeCities ?? [],
    logger: state.request.logger,
  });
  await writeEvaluation(state.request.outDir, evaluation);
  spend(state, { evaluations: 1, programCpuMs: evaluation.summary.programCpuMs });
  return evaluation;
};

const EMPTY_SUMMARY: EvaluationSummary = {
  runs: 0,
  completeRuns: 0,
  successRate: 0,
  conditionalMeanPain: null,
  programCpuMs: 0,
  failureReasons: {},
};

const record = async (
  state: State,
  program: PolicyProgram,
  devSummary: EvaluationSummary,
  accepted: boolean,
  reason: string,
): Promise<void> => {
  const index = state.campaign.iterations.length;
  const generationCostUsd = program.spend.costUsd ?? 0;
  const iteration = {
    index,
    programId: program.id,
    generationCostUsd,
    devSummary,
    accepted,
    reason,
  };
  state.campaign = { ...state.campaign, iterations: [...state.campaign.iterations, iteration] };
  await writeCampaign(state.request.outDir, state.campaign);
};

/**
 * B-self accepts only improvements over the incumbent lineage. B0 and
 * B-restart keep every compiling program as a selection candidate, because
 * the comparison of interest is validation-split selection with the same
 * generation budget but no feedback.
 */
const isAccepted = (state: State, summary: EvaluationSummary): boolean =>
  state.request.mode !== "B-self" ||
  state.incumbent === undefined ||
  isImprovement(summary, state.incumbent.summary);

/** One generation plus its development evaluation, with the acceptance decision. */
const iterate = async (
  state: State,
  input: GenerationInput,
  parent: PolicyProgram | undefined,
): Promise<ProgramEvaluation | undefined> => {
  const program = await generate(state, input, parent);
  const skip = skipReason(state, program);
  if (skip !== undefined) {
    await record(state, program, EMPTY_SUMMARY, false, skip);
    return undefined;
  }
  return judge(state, program);
};

const skipReason = (state: State, program: PolicyProgram): string | undefined => {
  if (program.compileError !== null) {
    return `compile error: ${program.compileError}`;
  }
  if (budgetExhausted(state.campaign) === "evaluation budget exhausted") {
    return "not evaluated: evaluation budget exhausted";
  }
  return undefined;
};

const judge = async (state: State, program: PolicyProgram): Promise<ProgramEvaluation> => {
  const evaluation = await evaluate(state, program, state.request.devSplit);
  const accepted = isAccepted(state, evaluation.summary);
  const reason = accepted
    ? "accepted"
    : "rejected: no improvement over incumbent on the development split";
  await record(state, program, evaluation.summary, accepted, reason);
  if (accepted) {
    state.incumbent = { program, summary: evaluation.summary };
  }
  return evaluation;
};

const nextInput = (
  state: State,
  attempt: number,
  lastEvaluation: ProgramEvaluation | undefined,
): GenerationInput => {
  if (state.request.mode !== "B-self" || state.incumbent === undefined) {
    return { kind: "initial", attempt };
  }
  return {
    kind: "revision",
    attempt,
    previousSource: state.incumbent.program.source,
    feedback: lastEvaluation === undefined ? "" : buildFeedback(lastEvaluation),
  };
};

/** On resume, the incumbent's stored development evaluation feeds the next revision. */
const lastAcceptedEvaluation = async (state: State): Promise<ProgramEvaluation | undefined> => {
  if (state.incumbent === undefined) {
    return undefined;
  }
  const stored = await readEvaluation(
    state.request.outDir,
    state.incumbent.program.id,
    state.request.devSplit,
  );
  return stored.ok ? stored.value : undefined;
};

const maxAttempts = (request: CampaignRequest): number =>
  request.mode === "B0" ? 1 : request.budget.maxGenerations;

const loop = async (state: State): Promise<void> => {
  let lastAccepted: ProgramEvaluation | undefined = await lastAcceptedEvaluation(state);
  const start = state.campaign.iterations.length;
  for (let attempt = start; attempt < maxAttempts(state.request); attempt += 1) {
    const stop = budgetExhausted(state.campaign);
    if (stop !== undefined) {
      state.campaign = { ...state.campaign, stopReason: stop };
      return;
    }
    const parent = state.request.mode === "B-self" ? state.incumbent?.program : undefined;
    const evaluation = await iterate(state, nextInput(state, attempt, lastAccepted), parent);
    if (evaluation !== undefined && state.incumbent?.program.id === evaluation.programId) {
      lastAccepted = evaluation;
    }
  }
  state.campaign = { ...state.campaign, stopReason: "attempt limit reached" };
};

/** Validation-split selection among accepted programs; the winner is frozen. */
const acceptedPrograms = (state: State): PolicyProgram[] => {
  const accepted = new Set(
    state.campaign.iterations.filter((item) => item.accepted).map((item) => item.programId),
  );
  return state.programs.filter((program) => accepted.has(program.id));
};

const select = async (state: State): Promise<void> => {
  const scored: { program: PolicyProgram; summary: EvaluationSummary }[] = [];
  for (const program of acceptedPrograms(state)) {
    const evaluation = await evaluate(state, program, state.request.validationSplit);
    scored.push({ program, summary: evaluation.summary });
  }
  const best = [...scored].sort((left, right) =>
    compareForSelection(left.summary, right.summary),
  )[0];
  state.campaign = { ...state.campaign, selectedProgramId: best?.program.id ?? null, frozen: true };
  await writeCampaign(state.request.outDir, state.campaign);
};

/**
 * Runs one campaign under fixed rules and budget. Every program and every
 * evaluation is written before the next step; the test split is never
 * touched here.
 */
export const runCampaign = async (request: CampaignRequest): Promise<Campaign> => {
  const state = (await resumeState(request)) ?? {
    request,
    campaign: initialCampaign(request),
    programs: [],
    incumbent: undefined,
  };
  if (state.campaign.frozen) {
    return state.campaign;
  }
  await writeCampaign(request.outDir, state.campaign);
  await loop(state);
  await select(state);
  return state.campaign;
};

/**
 * Resume: a campaign directory with the same id, mode, seed, and manifest
 * digest is continued from its recorded iterations. Programs and the
 * incumbent are rebuilt from the stored artifacts; nothing is regenerated.
 */
const resumeState = async (request: CampaignRequest): Promise<State | undefined> => {
  const stored = await readCampaign(request.outDir);
  if (!stored.ok) {
    return undefined;
  }
  assertSameCampaign(request, stored.value);
  const programs = await loadPrograms(request.outDir, stored.value);
  request.logger.log("info", "campaign.resume", { iterations: stored.value.iterations.length });
  return {
    request,
    campaign: stored.value,
    programs,
    incumbent: incumbentOf(stored.value, programs),
  };
};

const assertSameCampaign = (request: CampaignRequest, stored: Campaign): void => {
  const same =
    stored.id === request.id &&
    stored.mode === request.mode &&
    stored.seed === request.seed &&
    stored.manifestDigest === digestDocument(request.suite.manifest);
  if (!same) {
    throw new Error(`campaign directory ${request.outDir} holds a different campaign`);
  }
};

const incumbentOf = (
  campaign: Campaign,
  programs: readonly PolicyProgram[],
): State["incumbent"] => {
  const lastAccepted = [...campaign.iterations].reverse().find((item) => item.accepted);
  const program = programs.find((item) => item.id === lastAccepted?.programId);
  return lastAccepted === undefined || program === undefined
    ? undefined
    : { program, summary: lastAccepted.devSummary };
};

const loadPrograms = async (dir: string, campaign: Campaign): Promise<PolicyProgram[]> => {
  const programs: PolicyProgram[] = [];
  for (const item of campaign.iterations) {
    const program = await readProgram(dir, item.programId);
    if (!program.ok) {
      throw new Error(`campaign artifact for ${item.programId} is missing or invalid`);
    }
    programs.push(program.value);
  }
  return programs;
};
