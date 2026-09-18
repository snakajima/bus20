/**
 * Identifier ordering. All tie-breaking in the benchmark uses this
 * locale-independent, code-point lexical comparison so that replay does not
 * depend on the host locale.
 */
export const compareIds = (left: string, right: string): number => {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
};

export const sortIds = (ids: readonly string[]): string[] => [...ids].sort(compareIds);

/** Returns every ID that appears more than once, each reported once, in ID order. */
export const findDuplicateIds = (ids: readonly string[]): string[] => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      duplicates.add(id);
    }
    seen.add(id);
  }
  return sortIds([...duplicates]);
};
