import type { DatabaseSync } from "node:sqlite";
import { z } from "zod";
import { genreCountSchema } from "../../shared/schemas/filterOptionsSchema";
import type { FilterOptions } from "../ipc/types";
import { ALBUM_ARTIST_SQL } from "./ALBUM_ARTIST_SQL";

/** Row of the decade query; a NULL bucket holds the unknown-year albums. */
const decadeBucketSchema = z.object({
  decade: z.number().int().nullable(),
  count: z.number().int(),
});

/**
 * Collect the filter choices for the sidebar (`mp:library:getFilterOptions`).
 *
 * Genres are distinct non-empty values with the number of albums (identity
 * key groups) they appear on; decades are the distinct 10-year buckets that
 * actually contain tracks, likewise with their album counts — never a
 * min–max sweep, which a single outlier year (a junk tag, a classical
 * composition year) would blow up into hundreds of empty checkboxes. Both
 * counts follow the album filter's semantics: an album counts for every
 * genre / decade any of its tracks carries, which is exactly the set of
 * albums selecting that choice lists.
 *
 * Both queries are one pass over `musics` with a GROUP BY (a temp b-tree of
 * at most one row per distinct album per value), so the decade query costs
 * the same as the genre one already did — a few milliseconds at the 10k
 * track target — and the result is only refetched on library changes.
 *
 * @param db - The open library connection.
 * @returns Genre and decade choices with their album counts.
 */
export const getFilterOptions = (db: DatabaseSync): FilterOptions => {
  const genres = genreCountSchema.array().parse(
    db
      .prepare(
        `SELECT name, COUNT(*) AS count
         FROM (
           SELECT m.genre AS name
           FROM musics m
           WHERE m.genre <> ''
           GROUP BY m.genre, ${ALBUM_ARTIST_SQL}, m.album
         )
         GROUP BY name
         ORDER BY name`,
      )
      .all(),
  );
  // Integer division truncates toward zero, which is floor for the stored
  // years: the mapping / migration 002 keep only years > 0. A NULL year
  // yields a NULL bucket, which becomes the "Unknown" item's count.
  const buckets = decadeBucketSchema.array().parse(
    db
      .prepare(
        `SELECT decade, COUNT(*) AS count
         FROM (
           SELECT (m.year / 10) * 10 AS decade
           FROM musics m
           GROUP BY (m.year / 10) * 10, ${ALBUM_ARTIST_SQL}, m.album
         )
         GROUP BY decade
         ORDER BY decade`,
      )
      .all(),
  );
  const decades = buckets.filter(
    (bucket): bucket is { decade: number; count: number } =>
      bucket.decade !== null,
  );
  const unknownYearCount =
    buckets.find((bucket) => bucket.decade === null)?.count ?? 0;
  return { genres, decades, unknownYearCount };
};
