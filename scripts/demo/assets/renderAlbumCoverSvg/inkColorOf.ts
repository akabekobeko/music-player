/** Text color used on dark backgrounds. */
const LIGHT_INK = "#f7f4ee";

/** Text color used on light backgrounds. */
const DARK_INK = "#17171a";

/**
 * Pick a text color that stays readable on a background color.
 *
 * @param background - Background color as `#rrggbb`.
 * @returns A near-white color for dark backgrounds, a near-black one for
 *   light backgrounds (decided by the perceived brightness).
 */
export const inkColorOf = (background: string): string => {
  const value = Number.parseInt(background.slice(1), 16);
  const red = (value >> 16) & 0xff;
  const green = (value >> 8) & 0xff;
  const blue = value & 0xff;
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;
  return brightness < 140 ? LIGHT_INK : DARK_INK;
};
