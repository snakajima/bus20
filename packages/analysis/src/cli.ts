#!/usr/bin/env node
import { parseJsonWithSchema } from "@bus20/contracts/json";
import { formatIssues } from "@bus20/contracts/result";
import { suiteIndexSchema } from "@bus20/contracts/suite-index";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { analysisMarkdown, analyzeSuite } from "./report.js";

const USAGE = `usage:
  bus20-analyze --suite-index <file> --reference <policyId> --out <dir> [--seed N]`;

const EXIT_OK = 0;
const EXIT_FAILED = 1;
const EXIT_USAGE = 2;
const DEFAULT_SEED = 1;
const JSON_INDENT = 2;

export const ANALYSIS_JSON = "analysis.json";
export const ANALYSIS_MARKDOWN = "analysis.md";

const writeAtomic = async (filePath: string, text: string): Promise<void> => {
  await mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tempPath, text, "utf8");
  await rename(tempPath, filePath);
};

const parseSeed = (raw: string | undefined): number => {
  const seed = Number.parseInt(raw ?? String(DEFAULT_SEED), 10);
  return Number.isInteger(seed) && seed >= 0 ? seed : DEFAULT_SEED;
};

interface Options {
  readonly indexPath: string;
  readonly reference: string;
  readonly outDir: string;
  readonly seed: number;
}

const OPTIONS = {
  "suite-index": { type: "string" },
  reference: { type: "string" },
  out: { type: "string" },
  seed: { type: "string" },
} as const;

const parseOptions = (argv: readonly string[]): Options | undefined => {
  const { values } = parseArgs({ args: [...argv], options: OPTIONS });
  const indexPath = values["suite-index"];
  if (indexPath === undefined || values.reference === undefined || values.out === undefined) {
    return undefined;
  }
  return {
    indexPath,
    reference: values.reference,
    outDir: values.out,
    seed: parseSeed(values.seed),
  };
};

const analyze = async (options: Options): Promise<number> => {
  const index = parseJsonWithSchema(suiteIndexSchema, await readFile(options.indexPath, "utf8"));
  if (!index.ok) {
    process.stderr.write(`${formatIssues(index.issues)}\n`);
    return EXIT_FAILED;
  }
  const analysis = analyzeSuite(index.value, options.reference, options.seed);
  const json = `${JSON.stringify(analysis, null, JSON_INDENT)}\n`;
  await writeAtomic(path.join(options.outDir, ANALYSIS_JSON), json);
  await writeAtomic(path.join(options.outDir, ANALYSIS_MARKDOWN), analysisMarkdown(analysis));
  const summary = {
    cells: analysis.cells.length,
    paired: analysis.paired.length,
    outDir: options.outDir,
  };
  process.stdout.write(`${JSON.stringify(summary)}\n`);
  return EXIT_OK;
};

export const main = (argv: readonly string[]): Promise<number> => {
  const options = parseOptions(argv);
  if (options === undefined) {
    process.stderr.write(`${USAGE}\n`);
    return Promise.resolve(EXIT_USAGE);
  }
  return analyze(options);
};

main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`,
    );
    process.exitCode = EXIT_FAILED;
  },
);
