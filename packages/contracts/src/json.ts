import { type ZodType } from "zod";
import { fail, issue, type Issue, ok, type Result } from "./result.js";

/**
 * Boundary parser: turns untrusted text into a validated value or a list of
 * issues. This is the only sanctioned way to bring external JSON into typed
 * code; no module may cast parsed JSON into a trusted type.
 */
export const parseJsonText = (text: string): Result<unknown> => {
  try {
    return ok(JSON.parse(text));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "invalid JSON";
    return fail([issue("", message)]);
  }
};

const zodIssuesToIssues = (
  zodIssues: readonly { path: PropertyKey[]; message: string }[],
): Issue[] => zodIssues.map((item) => issue(item.path.map(String).join("."), item.message));

export const validateWithSchema = <T>(schema: ZodType<T>, value: unknown): Result<T> => {
  const parsed = schema.safeParse(value);
  if (parsed.success) {
    return ok(parsed.data);
  }
  return fail(zodIssuesToIssues(parsed.error.issues));
};

export const parseJsonWithSchema = <T>(schema: ZodType<T>, text: string): Result<T> => {
  const parsed = parseJsonText(text);
  if (!parsed.ok) {
    return parsed;
  }
  return validateWithSchema(schema, parsed.value);
};
