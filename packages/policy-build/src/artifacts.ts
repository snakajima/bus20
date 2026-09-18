import {
  type Campaign,
  campaignSchema,
  type PolicyProgram,
  policyProgramSchema,
  type ProgramEvaluation,
  programEvaluationSchema,
} from "@bus20/contracts/policy-artifact";
import { type Result } from "@bus20/contracts/result";
import { readJsonFile, writeJsonAtomic } from "@bus20/runner/files";
import path from "node:path";

/**
 * Campaign directory layout. Everything a campaign produces is kept:
 *   campaign.json                      the record (rules, budget, every iteration)
 *   programs/<programId>.json          frozen programs, compiling or not
 *   evaluations/<programId>.<split>.json
 *   runs/<programId>/<split>/...       suite runner output (logs, results, index)
 */
export const CAMPAIGN_FILE = "campaign.json";

export const programPath = (dir: string, programId: string): string =>
  path.join(dir, "programs", `${programId}.json`);

export const evaluationPath = (dir: string, programId: string, split: string): string =>
  path.join(dir, "evaluations", `${programId}.${split}.json`);

export const runsDir = (dir: string, programId: string, split: string): string =>
  path.join(dir, "runs", programId, split);

export const writeCampaign = (dir: string, campaign: Campaign): Promise<void> =>
  writeJsonAtomic(path.join(dir, CAMPAIGN_FILE), campaign);

export const writeProgram = (dir: string, program: PolicyProgram): Promise<void> =>
  writeJsonAtomic(programPath(dir, program.id), program);

export const writeEvaluation = (dir: string, evaluation: ProgramEvaluation): Promise<void> =>
  writeJsonAtomic(evaluationPath(dir, evaluation.programId, evaluation.split), evaluation);

export const readCampaign = (dir: string): Promise<Result<Campaign>> =>
  readJsonFile(path.join(dir, CAMPAIGN_FILE), campaignSchema);

export const readProgram = (dir: string, programId: string): Promise<Result<PolicyProgram>> =>
  readJsonFile(programPath(dir, programId), policyProgramSchema);

export const readEvaluation = (
  dir: string,
  programId: string,
  split: string,
): Promise<Result<ProgramEvaluation>> =>
  readJsonFile(evaluationPath(dir, programId, split), programEvaluationSchema);
