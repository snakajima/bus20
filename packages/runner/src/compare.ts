import { type RunLog, runLogSchema } from "@bus20/contracts/run-log";
import { type RunResult, runResultSchema } from "@bus20/contracts/run-result";
import { fail, type Issue, ok, type Result } from "@bus20/contracts/result";
import path from "node:path";
import { readJsonFile } from "./files.js";
import { RUN_LOG_FILE, RUN_RESULT_FILE } from "./run-scenario.js";

/** One policy's outcome on one scenario, with cost and latency accounting. */
export interface ComparisonRow {
  readonly policyId: string;
  readonly kind: string;
  readonly modelId: string | null;
  readonly scenarioId: string;
  readonly status: RunResult["status"];
  readonly pain: number | null;
  readonly completedCount: number;
  readonly requestCount: number;
  readonly decisions: number;
  readonly latencyMedianMs: number;
  readonly latencyP95Ms: number;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly costUsd: number | null;
}

const percentile = (values: readonly number[], fraction: number): number => {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((left, right) => left - right);
  const rank = Math.min(sorted.length, Math.max(1, Math.ceil(fraction * sorted.length)));
  return sorted[rank - 1] ?? 0;
};

const sumUsage = (log: RunLog, key: string): number | null => {
  const values = log.decisions.map((decision) => decision.usage?.[key]);
  if (values.every((value) => value === undefined)) {
    return null;
  }
  return values.reduce<number>((total, value) => total + (value ?? 0), 0);
};

export const toRow = (log: RunLog, result: RunResult): ComparisonRow => {
  const latencies = log.decisions.map((decision) => decision.wallLatencyMs);
  return {
    policyId: log.policy.id,
    kind: log.policy.kind,
    modelId: log.policy.modelId ?? null,
    scenarioId: log.scenarioId,
    status: result.status,
    pain: result.pain,
    completedCount: result.completedCount,
    requestCount: result.requestCount,
    decisions: log.decisions.length,
    latencyMedianMs: percentile(latencies, 0.5),
    latencyP95Ms: percentile(latencies, 0.95),
    inputTokens: sumUsage(log, "inputTokens") ?? 0,
    outputTokens: sumUsage(log, "outputTokens") ?? 0,
    costUsd: sumUsage(log, "costUsd"),
  };
};

/** Loads a run directory written by `runAndScore`. */
export const loadRunDirectory = async (dir: string): Promise<Result<ComparisonRow>> => {
  const log = await readJsonFile(path.join(dir, RUN_LOG_FILE), runLogSchema);
  const result = await readJsonFile(path.join(dir, RUN_RESULT_FILE), runResultSchema);
  if (!log.ok || !result.ok) {
    const issues: Issue[] = [...(log.ok ? [] : log.issues), ...(result.ok ? [] : result.issues)];
    return fail(issues);
  }
  return ok(toRow(log.value, result.value));
};

const cell = (value: number | string | null, digits = 2): string =>
  value === null ? "n/a" : typeof value === "number" ? value.toFixed(digits) : value;

/**
 * Markdown table. Failed runs stay visible with `pain` n/a; the table never
 * averages away failures.
 */
export const comparisonMarkdown = (rows: readonly ComparisonRow[]): string => {
  const header =
    "| policy | kind | model | scenario | status | pain (min²) | served | decisions | latency p50/p95 (ms) | tokens in/out | cost (USD) |";
  const divider = "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |";
  const body = rows.map(
    (row) =>
      `| ${row.policyId} | ${row.kind} | ${cell(row.modelId)} | ${row.scenarioId} | ${row.status} | ` +
      `${cell(row.pain)} | ${row.completedCount}/${row.requestCount} | ${row.decisions} | ` +
      `${cell(row.latencyMedianMs, 0)}/${cell(row.latencyP95Ms, 0)} | ` +
      `${row.inputTokens}/${row.outputTokens} | ${cell(row.costUsd, 4)} |`,
  );
  return [header, divider, ...body].join("\n");
};
