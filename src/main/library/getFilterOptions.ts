import type { DatabaseSync } from "node:sqlite";
import type { FilterOptions } from "../ipc/types";
import { ALBUM_ARTIST_SQL } from "./ALBUM_ARTIST_SQL";

/**
 * Collect the filter choices for the sidebar (`mp:library:getFilterOptions`).
 *
 * Genres are distinct non-empty values with the number of albums (identity
 * key groups) they appear on; the year range spans the whole library so the
 * decade checkboxes can be generated from it.
 *
 * @param db - The open library connection.
 * @returns Genre choices and the library-wide year range.
 */
export const getFilterOptions = (db: DatabaseSync): FilterOptions => {
  const genres = db
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
    .all() as Array<{ name: string; count: number }>;
  const range = db
    .prepare("SELECT MIN(year) AS min, MAX(year) AS max FROM musics")
    .get() as { min: number | null; max: number | null };
  return {
    genres,
    yearRange:
      range.min !== null && range.max !== null
        ? { min: range.min, max: range.max }
        : null,
  };
};
