/**
 * Result type for boundary validation. Failures carry a list of issues
 * instead of throwing so that callers can report every problem at once.
 */
export interface Issue {
  readonly path: string;
  readonly message: string;
}

export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly issues: readonly Issue[] };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });

export const fail = <T>(issues: readonly Issue[]): Result<T> => ({ ok: false, issues });

export const issue = (path: string, message: string): Issue => ({ path, message });

/** Formats issues as one line each, for logs and CLI error output. */
export const formatIssues = (issues: readonly Issue[]): string =>
  issues
    .map((item) => (item.path === "" ? item.message : `${item.path}: ${item.message}`))
    .join("\n");
