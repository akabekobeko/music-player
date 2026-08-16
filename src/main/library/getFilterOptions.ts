import type { DatabaseSync } from "node:sqlite";
import type { FilterOptions } from "../ipc/types";
import { ALBUM_ARTIST_SQL } from "./ALBUM_ARTIST_SQL";

/**
 * Collect the filter choices for the sidebar (`mp:library:getFilterOptions`).
 *
 * Genres are distinct non-empty values with the number of albums (identity
 * key groups) they appear on; decades are the distinct 10-year buckets that
 * actually contain tracks — never a min–max sweep, which a single outlier
 * year (a junk tag, a classical composition year) would blow up into
 * hundreds of empty checkboxes.
 *
 * @param db - The open library connection.
 * @returns Genre choices and the populated decade start years.
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
  // Decade bucketing happens in JS (Math.floor) — SQLite's integer division
  // truncates toward zero, which would mis-bucket negative years.
  const years = db
    .prepare(
      "SELECT DISTINCT year FROM musics WHERE year IS NOT NULL ORDER BY year",
    )
    .all() as Array<{ year: number }>;
  const decades = [
    ...new Set(years.map(({ year }) => Math.floor(year / 10) * 10)),
  ];
  return { genres, decades };
};
