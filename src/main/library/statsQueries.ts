import type { DatabaseSync } from "node:sqlite";
import type { LibraryStats } from "../ipc/types";

/**
 * Library-wide counters for the settings page (`mp:library:getStats`).
 * Albums count by the identity key `(COALESCE(NULLIF(album_artist, ''),
 * artist), album)` — the same grouping the Album view uses.
 */

/**
 * Collect the library statistics.
 *
 * @param db - The open library connection.
 * @returns Track / artist / album counts and the summed duration.
 */
export const getLibraryStats = (db: DatabaseSync): LibraryStats => {
  const row = db
    .prepare(
      `SELECT
         COUNT(*)                       AS musicCount,
         COUNT(DISTINCT artist)         AS artistCount,
         COALESCE(SUM(duration_ms), 0)  AS totalDurationMs,
         (SELECT COUNT(*) FROM (
            SELECT 1 FROM musics
            GROUP BY COALESCE(NULLIF(album_artist, ''), artist), album
         ))                             AS albumCount
       FROM musics`,
    )
    .get() as LibraryStats;
  return {
    musicCount: row.musicCount,
    artistCount: row.artistCount,
    albumCount: row.albumCount,
    totalDurationMs: row.totalDurationMs,
  };
};
