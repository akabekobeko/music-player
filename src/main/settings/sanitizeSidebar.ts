import type { AppSettings } from "../ipc/types";
import { asFiniteNumber } from "./asFiniteNumber";

/**
 * Validate an unknown value as `AppSettings["sidebar"]`.
 *
 * The renderer always saves the complete `{ open, width }` pair, so a value
 * missing either field is treated as invalid rather than merged field-wise.
 *
 * @param value - Raw `sidebar` value from disk or a patch.
 * @returns The validated state, or `undefined` when the shape is wrong.
 */
export const sanitizeSidebar = (
  value: unknown,
): AppSettings["sidebar"] | undefined => {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const raw = value as Record<string, unknown>;
  const width = asFiniteNumber(raw.width);
  if (typeof raw.open !== "boolean" || width === undefined || width <= 0) {
    return undefined;
  }

  return { open: raw.open, width };
};
