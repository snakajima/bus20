/**
 * Deterministic PRNG (SplitMix32 seeded, xorshift-style step). Sequences are
 * fully determined by the seed so demand files can be regenerated bit for
 * bit, and no wall-clock or Math.random ever enters a dataset.
 */
export interface Rng {
  /** Uniform in [0, 1). */
  readonly next: () => number;
  /** Uniform integer in [0, bound). */
  readonly int: (bound: number) => number;
  /** Uniform pick from a non-empty list. */
  readonly pick: <T>(items: readonly T[]) => T;
}

const UINT32 = 0x1_0000_0000;

export const createRng = (seed: number): Rng => {
  let state = seed >>> 0;
  const nextUint32 = (): number => {
    state = (state + 0x9e3779b9) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 16), 0x21f0aaad) >>> 0;
    value = Math.imul(value ^ (value >>> 15), 0x735a2d97) >>> 0;
    return (value ^ (value >>> 15)) >>> 0;
  };
  const next = (): number => nextUint32() / UINT32;
  const int = (bound: number): number => Math.floor(next() * bound);
  const pick = <T>(items: readonly T[]): T => {
    const item = items[int(items.length)];
    if (item === undefined) {
      throw new Error("pick from empty list");
    }
    return item;
  };
  return { next, int, pick };
};

/** FNV-1a over a label, folded into a 32-bit seed. Stable across platforms. */
export const seedFromLabel = (baseSeed: number, label: string): number => {
  let hash = (0x811c9dc5 ^ baseSeed) >>> 0;
  for (const char of label) {
    hash = Math.imul(hash ^ (char.codePointAt(0) ?? 0), 0x01000193) >>> 0;
  }
  return hash;
};
