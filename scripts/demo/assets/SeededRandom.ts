/**
 * Deterministic pseudo random number generator (mulberry32).
 *
 * The demo assets must come out identical on every run, so nothing in the
 * generator may use `Math.random`. Each artist and each cover gets its own
 * instance seeded from its name, which keeps one entry's output stable when
 * another entry of the seed data changes.
 */
export class SeededRandom {
  #state: number;

  /**
   * @param seed - Text the sequence is derived from (FNV-1a hashed).
   */
  constructor(seed: string) {
    let hash = 0x811c9dc5;
    for (const char of seed) {
      hash ^= char.codePointAt(0) ?? 0;
      hash = Math.imul(hash, 0x01000193);
    }

    this.#state = hash >>> 0;
  }

  /**
   * @returns The next value in `[0, 1)`.
   */
  next(): number {
    this.#state = (this.#state + 0x6d2b79f5) >>> 0;
    let t = this.#state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * @param min - Lower bound, inclusive.
   * @param max - Upper bound, inclusive.
   * @returns An integer in `[min, max]`.
   */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /**
   * @param min - Lower bound, inclusive.
   * @param max - Upper bound, exclusive.
   * @returns A real number in `[min, max)`.
   */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * @param probability - Chance of `true` in `[0, 1]`.
   * @returns Whether the draw hit.
   */
  chance(probability: number): boolean {
    return this.next() < probability;
  }

  /**
   * @param items - Non-empty candidates.
   * @returns One of the candidates.
   */
  pick<T>(items: readonly T[]): T {
    const item = items[Math.floor(this.next() * items.length)];
    if (item === undefined) {
      throw new Error("Cannot pick from an empty list.");
    }

    return item;
  }

  /**
   * @param items - Items to reorder.
   * @returns A shuffled copy (Fisher-Yates); the input is left untouched.
   */
  shuffle<T>(items: readonly T[]): T[] {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const a = result[i] as T;
      result[i] = result[j] as T;
      result[j] = a;
    }

    return result;
  }
}
