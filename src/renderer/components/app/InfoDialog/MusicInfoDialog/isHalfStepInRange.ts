/**
 * Whether a text field holds a multiple of 0.5 within `[min, max]` — the
 * rating scale (0, 0.5, 1, … 5).
 *
 * Accepts `3`, `3.0`, `3.5` and `.5`; rejects other fractions and anything
 * that is not a plain decimal number.
 *
 * @param text - Raw input text.
 * @param min - Smallest accepted value (inclusive).
 * @param max - Largest accepted value (inclusive).
 * @returns `true` for an in-range half step.
 */
export const isHalfStepInRange = (
  text: string,
  min: number,
  max: number,
): boolean => {
  if (!/^\d*(\.\d+)?$/.test(text) || text === "") {
    return false;
  }

  const value = Number(text);
  return value >= min && value <= max && Number.isInteger(value * 2);
};
