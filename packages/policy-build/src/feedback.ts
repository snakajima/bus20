import { type ProgramEvaluation } from "@bus20/contracts/policy-artifact";
import { type SuiteRun } from "@bus20/contracts/suite-index";

const WORST_COUNT = 5;
const DETAIL_LIMIT = 300;

const runLine = (run: SuiteRun): string => {
  const cell = `${run.scenario.city}/${run.scenario.load}/${run.scenario.pattern}`;
  if (run.status === "failed") {
    const detail = (run.failureDetail ?? "").slice(0, DETAIL_LIMIT);
    return `- ${run.scenario.id} (${cell}): FAILED ${run.failureReason ?? ""}: ${detail}`;
  }
  return `- ${run.scenario.id} (${cell}): pain ${run.pain?.toFixed(2) ?? "n/a"} min², ${run.completedCount}/${run.requestCount} served`;
};

/**
 * Aggregate feedback only: summary numbers, failure reasons with their
 * messages, and the worst scenarios. No trajectories, no reference
 * decisions, and nothing from the validation or test splits.
 */
const headline = (evaluation: ProgramEvaluation): string[] => {
  const { summary } = evaluation;
  return [
    `Development split "${evaluation.split}": ${summary.completeRuns}/${summary.runs} runs complete ` +
      `(success rate ${(100 * summary.successRate).toFixed(0)}%).`,
    summary.conditionalMeanPain === null
      ? "No run completed, so there is no pain score yet."
      : `Mean pain over complete runs: ${summary.conditionalMeanPain.toFixed(2)} min² (lower is better).`,
    `Program CPU across all decisions: ${summary.programCpuMs.toFixed(0)} ms.`,
  ];
};

export const buildFeedback = (evaluation: ProgramEvaluation): string => {
  const failed = evaluation.runs.filter((run) => run.status === "failed");
  const worst = evaluation.runs
    .filter((run) => run.status === "complete")
    .sort((left, right) => (right.pain ?? 0) - (left.pain ?? 0))
    .slice(0, WORST_COUNT);
  return [
    ...headline(evaluation),
    "",
    failed.length === 0 ? "Failed runs: none." : `Failed runs (${failed.length}):`,
    ...failed.map(runLine),
    "",
    worst.length === 0 ? "" : "Worst complete scenarios:",
    ...worst.map(runLine),
  ].join("\n");
};
