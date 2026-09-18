import { parseJsonWithSchema } from "@bus20/contracts/json";
import { fail, issue, type Result } from "@bus20/contracts/result";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { type ZodType } from "zod";

const JSON_INDENT = 2;

/** Reads and validates a JSON document; I/O errors become issues, not exceptions. */
export const readJsonFile = async <T>(filePath: string, schema: ZodType<T>): Promise<Result<T>> => {
  try {
    const text = await readFile(filePath, "utf8");
    return parseJsonWithSchema(schema, text);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return fail([issue(filePath, message)]);
  }
};

/**
 * Writes JSON atomically: to a temporary file beside the destination, then a
 * rename, so readers never observe a partially written document.
 */
export const writeTextAtomic = async (filePath: string, text: string): Promise<void> => {
  await mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tempPath, text, "utf8");
  await rename(tempPath, filePath);
};

export const writeJsonAtomic = (filePath: string, value: unknown): Promise<void> =>
  writeTextAtomic(filePath, `${JSON.stringify(value, null, JSON_INDENT)}\n`);
