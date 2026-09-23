/**
 * Whether a text field holds an integer within `[min, max]`.
 *
 * Only plain decimal digits (with an optional leading minus) count — `1e3`,
 * `0x10`, ` 12 ` and `12.0` are rejected so what the user sees is exactly
 * what gets saved.
 *
 * @param text - Raw input text.
 * @param min - Smallest accepted value (inclusive).
 * @param max - Largest accepted value (inclusive).
 * @returns `true` for an in-range integer.
 */
export const isIntegerInRange = (
  text: string,
  min: number,
  max: number,
): boolean => {
  if (!/^-?\d+$/.test(text)) {
    return false;
  }

  const value = Number(text);
  return value >= min && value <= max;
};
