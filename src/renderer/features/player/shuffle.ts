/**
 * Fisher–Yates shuffle for queue generation
 * (`docs/specs/v1.0/features/artist-view.md`): shuffling happens once when
 * the queue is built — there is no dynamic shuffle mode during playback.
 *
 * @param items - Source list (not mutated).
 * @param random - `[0, 1)` random source; injectable for tests.
 * @returns A new shuffled array.
 */
export const shuffle = <T>(
  items: readonly T[],
  random: () => number = Math.random,
): T[] => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    const a = result[index] as T;
    result[index] = result[swap] as T;
    result[swap] = a;
  }

  return result;
};
