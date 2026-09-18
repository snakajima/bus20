/**
 * Simulation time is integer milliseconds. Scores are reported in minutes and
 * minutes squared; conversion happens only at scoring time.
 */
export const MS_PER_SECOND = 1000;
export const SECONDS_PER_MINUTE = 60;
export const MS_PER_MINUTE = MS_PER_SECOND * SECONDS_PER_MINUTE;

export const msToMinutes = (ms: number): number => ms / MS_PER_MINUTE;

export const isTimestampMs = (value: number): boolean => Number.isInteger(value) && value >= 0;
