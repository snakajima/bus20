import { type EvaluationSummary } from "@bus20/contracts/policy-artifact";

/**
 * Fixed acceptance rule for B-self, decided before any run: a revision is
 * accepted only if it completes at least as many runs as the incumbent and
 * either completes strictly more or, at equal success, lowers the
 * conditional mean pain. Ties are rejected so noise cannot drift the lineage.
 */
export const isImprovement = (
  candidate: EvaluationSummary,
  incumbent: EvaluationSummary,
): boolean => {
  if (candidate.successRate > incumbent.successRate) {
    return true;
  }
  if (candidate.successRate < incumbent.successRate) {
    return false;
  }
  if (candidate.conditionalMeanPain === null || incumbent.conditionalMeanPain === null) {
    return false;
  }
  return candidate.conditionalMeanPain < incumbent.conditionalMeanPain;
};

/** Higher success first, then lower conditional pain; stable on ties (earlier wins). */
export const compareForSelection = (left: EvaluationSummary, right: EvaluationSummary): number => {
  if (left.successRate !== right.successRate) {
    return right.successRate - left.successRate;
  }
  const leftPain = left.conditionalMeanPain ?? Number.POSITIVE_INFINITY;
  const rightPain = right.conditionalMeanPain ?? Number.POSITIVE_INFINITY;
  return leftPain - rightPain;
};
