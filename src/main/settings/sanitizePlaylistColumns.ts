import type { PlaylistColumnsSettings } from "../ipc/types";
import { asFiniteNumber } from "./asFiniteNumber";

/**
 * Validate an unknown value as the `widths` of a
 * {@link PlaylistColumnsSettings}.
 *
 * Only own entries are read and the result is built by defining properties,
 * never by assignment or a generic merge, so a crafted key cannot reach a
 * prototype. `__proto__` is dropped outright: it names no column.
 *
 * @param value - Raw `widths` value from disk or a patch.
 * @returns The usable widths rounded to integers; empty when the value is
 *   not a plain key-value object.
 */
const sanitizeWidths = (value: unknown): Record<string, number> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).flatMap(([id, raw]): Array<[string, number]> => {
      const width = asFiniteNumber(raw);
      if (id === "__proto__" || width === undefined) {
        return [];
      }

      // Rounded before the range check, so 0.4 becomes 0 and is dropped.
      const rounded = Math.round(width);
      return rounded >= 1 ? [[id, rounded]] : [];
    }),
  );
};

/**
 * Validate an unknown value as `AppSettings["playlistColumns"]`
 * (`docs/specs/v1.3/architecture/column-settings.md`).
 *
 * Main only guards the types and the value ranges: whether a column id is
 * known, and raising a width to the minimum, are left to the Renderer,
 * which owns the column definitions.
 *
 * @param value - Raw `playlistColumns` value from disk or a patch.
 * @returns The validated layout, or `undefined` when the value is not an
 *   object or `visibleIds` is not an array. Unusable `widths` are emptied
 *   without discarding `visibleIds`.
 */
export const sanitizePlaylistColumns = (
  value: unknown,
): PlaylistColumnsSettings | undefined => {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const raw = value as Record<string, unknown>;
  if (!Array.isArray(raw.visibleIds)) {
    return undefined;
  }

  return {
    visibleIds: [
      ...new Set(
        raw.visibleIds.filter((id): id is string => typeof id === "string"),
      ),
    ],
    widths: sanitizeWidths(raw.widths),
  };
};
