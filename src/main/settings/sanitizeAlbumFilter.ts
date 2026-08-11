import type { AlbumFilter } from "../ipc/types";
import { asFiniteNumber } from "./asFiniteNumber";

/**
 * Validate an unknown value as an {@link AlbumFilter}, dropping any field
 * that has the wrong shape.
 *
 * @param value - Raw `albumFilter` value from disk or a patch.
 * @returns A cleaned filter, or `undefined` when nothing valid remains.
 */
export const sanitizeAlbumFilter = (
  value: unknown,
): AlbumFilter | undefined => {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const raw = value as Record<string, unknown>;
  const filter: {
    text?: string;
    genres?: string[];
    decades?: Array<number | null>;
  } = {};
  if (typeof raw.text === "string") {
    filter.text = raw.text;
  }

  if (Array.isArray(raw.genres)) {
    filter.genres = raw.genres.filter(
      (v): v is string => typeof v === "string",
    );
  }

  if (Array.isArray(raw.decades)) {
    filter.decades = raw.decades.filter(
      (v): v is number | null => v === null || asFiniteNumber(v) !== undefined,
    );
  }

  return Object.keys(filter).length > 0 ? filter : undefined;
};
