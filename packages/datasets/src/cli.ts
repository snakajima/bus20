#!/usr/bin/env node
import { parseJsonWithSchema } from "@bus20/contracts/json";
import { formatIssues } from "@bus20/contracts/result";
import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { buildSuite } from "./build-suite.js";
import { loadSuite, writeSuite } from "./files.js";
import { suiteConfigSchema } from "./suite-config.js";

const USAGE = `usage:
  bus20-data generate --config <file> --out <dir> [--created-at <iso-date>]
  bus20-data verify --manifest <file>`;

const EXIT_OK = 0;
const EXIT_FAILED = 1;
const EXIT_USAGE = 2;

const usageError = (): number => {
  process.stderr.write(`${USAGE}\n`);
  return EXIT_USAGE;
};

const emit = (value: unknown): void => {
  process.stdout.write(`${JSON.stringify(value)}\n`);
};

const generate = async (configPath: string, outDir: string, createdAt: string): Promise<number> => {
  const config = parseJsonWithSchema(suiteConfigSchema, await readFile(configPath, "utf8"));
  if (!config.ok) {
    process.stderr.write(`${formatIssues(config.issues)}\n`);
    return EXIT_USAGE;
  }
  const suite = buildSuite(config.value, createdAt);
  const manifestPath = await writeSuite(outDir, suite);
  emit({
    manifestPath,
    benchmarkVersion: suite.manifest.benchmarkVersion,
    maps: suite.maps.length,
    scenarios: suite.scenarios.length,
  });
  return EXIT_OK;
};

const verify = async (manifestPath: string): Promise<number> => {
  const suite = await loadSuite(manifestPath);
  if (!suite.ok) {
    process.stderr.write(`${formatIssues(suite.issues)}\n`);
    return EXIT_FAILED;
  }
  emit({
    benchmarkVersion: suite.value.manifest.benchmarkVersion,
    maps: suite.value.maps.size,
    scenarios: suite.value.scenarios.size,
    verified: true,
  });
  return EXIT_OK;
};

export const main = async (argv: readonly string[]): Promise<number> => {
  const { values, positionals } = parseArgs({
    args: [...argv],
    allowPositionals: true,
    options: {
      config: { type: "string" },
      out: { type: "string" },
      manifest: { type: "string" },
      "created-at": { type: "string" },
    },
  });
  const [command] = positionals;
  if (command === "generate" && values.config !== undefined && values.out !== undefined) {
    return generate(values.config, values.out, values["created-at"] ?? new Date().toISOString());
  }
  if (command === "verify" && values.manifest !== undefined) {
    return verify(values.manifest);
  }
  return usageError();
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
