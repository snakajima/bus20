import { createHash } from "node:crypto";
import { compareIds } from "./ids.js";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Canonical JSON: object keys sorted by code point at every level, no
 * whitespace. Equal documents produce equal text regardless of key order or
 * formatting in the source file.
 */
export const canonicalJson = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  if (isPlainObject(value)) {
    const entries = Object.keys(value)
      .sort(compareIds)
      .filter((key) => value[key] !== undefined)
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
};

export const DIGEST_PREFIX = "sha256:" as const;

/** Content digest of any JSON-serialisable document, formatted as `sha256:<hex>`. */
export const digestDocument = (value: unknown): string =>
  `${DIGEST_PREFIX}${createHash("sha256").update(canonicalJson(value), "utf8").digest("hex")}`;
