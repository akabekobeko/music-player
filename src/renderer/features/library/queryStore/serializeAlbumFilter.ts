import type { AlbumFilter } from "@mp/ipc";

/**
 * Canonical serialisation of an {@link AlbumFilter} for the query key.
 *
 * Two filters with the same meaning must map to the same key (the cache
 * identity), so inactive fields are dropped and the OR-set fields are
 * sorted — `{genres: ["a","b"]}` and `{genres: ["b","a"]}` share one entry.
 *
 * @param filter - Filter to serialise.
 * @returns Deterministic JSON of the active filter fields.
 */
export const serializeAlbumFilter = (filter: AlbumFilter): string => {
  const text = filter.text?.trim() ?? "";
  const musicTitle = filter.musicTitle?.trim() ?? "";
  const genres = [...(filter.genres ?? [])].sort();
  const decades = [...(filter.decades ?? [])].sort(
    // Numeric ascending with the unknown-year marker (null) last.
    (a, b) => (a === null ? 1 : b === null ? -1 : a - b),
  );
  return JSON.stringify({
    ...(text !== "" ? { text } : {}),
    ...(musicTitle !== "" ? { musicTitle } : {}),
    ...(genres.length > 0 ? { genres } : {}),
    ...(decades.length > 0 ? { decades } : {}),
  });
};
