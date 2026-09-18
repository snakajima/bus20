/**
 * Structured logging on stderr. Stdout is reserved for the CLI's JSON output.
 */
export type LogLevel = "info" | "warn" | "error";

export interface Logger {
  readonly log: (
    level: LogLevel,
    event: string,
    fields?: Readonly<Record<string, unknown>>,
  ) => void;
}

export const createStderrLogger = (): Logger => ({
  log: (level, event, fields = {}) => {
    process.stderr.write(
      `${JSON.stringify({ time: new Date().toISOString(), level, event, ...fields })}\n`,
    );
  },
});

export const silentLogger: Logger = { log: () => undefined };
