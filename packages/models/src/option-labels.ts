/**
 * Short, position-based labels for options (A, B, ..., Z, AA, AB, ...). A
 * constrained-output schema over labels is the same for every decision with
 * the same option count, so the provider compiles its grammar once instead
 * of once per decision (Anthropic rate-limits grammar compilation).
 */
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const optionLabel = (index: number): string => {
  let value = index;
  let label = "";
  do {
    label = `${ALPHABET.charAt(value % ALPHABET.length)}${label}`;
    value = Math.floor(value / ALPHABET.length) - 1;
  } while (value >= 0);
  return label;
};

export const optionLabels = (count: number): string[] =>
  Array.from({ length: count }, (_, index) => optionLabel(index));

/** Label to option id for one request; an unknown label is undefined. */
export const labelMap = (ids: readonly string[]): ReadonlyMap<string, string> =>
  new Map(ids.map((id, index) => [optionLabel(index), id]));
