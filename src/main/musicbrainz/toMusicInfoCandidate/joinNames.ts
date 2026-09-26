import { NAME_SEPARATOR } from "../constants";

/**
 * Join people's names into the single string a tag holds, or `null` when
 * there is nobody (`docs/specs/v1.2/architecture/metadata-mapping.md`).
 * Joining happens once, at the end, so a credited name that itself
 * contains the separator is never split again.
 *
 * @param names - Distinct names in order.
 * @returns The joined string, or `null` for an empty list.
 */
export const joinNames = (names: readonly string[]): string | null =>
  names.length === 0 ? null : names.join(NAME_SEPARATOR);
