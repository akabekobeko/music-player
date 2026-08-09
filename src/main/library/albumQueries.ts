import type { DatabaseSync } from "node:sqlite";
import type { AlbumFilter, AlbumSummary, FilterOptions } from "../ipc/types";

/**
 * Album-list queries for the Album view
 * (`docs/specs/v1.0/features/album-view.md`): filter options for the sidebar
 * and the filtered, grouped album summaries. Filtering happens here as a
 * WHERE clause — never in the Renderer — so the 10k-track target stays fast.
 *
 * The album identity is `(COALESCE(NULLIF(album_artist, ''), artist), album)`
 * (`docs/specs/v1.0/architecture/database.md`). `AlbumSummary.albumKey`
 * serialises that pair with a NUL separator — the same key shape the
 * Renderer's `groupAlbums` builds, and what `mp:library:getMusicsByAlbum`
 * decodes back.
 */

/** SQL expression of the album's display artist (identity key part). */
const ALBUM_ARTIST_SQL = "COALESCE(NULLIF(m.album_artist, ''), m.artist)";

/** Fragment of a WHERE clause: SQL snippet plus its bound parameters. */
type WhereFragment = {
  readonly sql: string;
  readonly params: ReadonlyArray<string | number>;
};

/** Escape `%` / `_` / `\` so user text matches literally under `ESCAPE '\'`. */
const escapeLikePattern = (text: string): string =>
  text.replace(/[\\%_]/g, (ch) => `\\${ch}`);

/**
 * Convert an {@link AlbumFilter} into WHERE-clause fragments.
 *
 * Kinds combine with AND; values inside one kind combine with OR. Exported
 * separately from the query so the conversion is unit-testable without a DB.
 *
 * @param filter - Filter condition from the Renderer.
 * @returns One fragment per active filter kind (empty when unfiltered).
 */
export const buildAlbumWhere = (filter: AlbumFilter): WhereFragment[] => {
  const fragments: WhereFragment[] = [];

  const text = filter.text?.trim() ?? "";
  if (text !== "") {
    const pattern = `%${escapeLikePattern(text)}%`;
    fragments.push({
      sql: `(m.album LIKE ? ESCAPE '\\' OR ${ALBUM_ARTIST_SQL} LIKE ? ESCAPE '\\')`,
      params: [pattern, pattern],
    });
  }

  const genres = filter.genres ?? [];
  if (genres.length > 0) {
    fragments.push({
      sql: `m.genre IN (${genres.map(() => "?").join(", ")})`,
      params: [...genres],
    });
  }

  const decades = filter.decades ?? [];
  if (decades.length > 0) {
    const terms = decades.map((decade) =>
      decade === null ? "m.year IS NULL" : "(m.year >= ? AND m.year < ?)",
    );
    fragments.push({
      sql: `(${terms.join(" OR ")})`,
      params: decades
        .filter((decade): decade is number => decade !== null)
        .flatMap((decade) => [decade, decade + 10]),
    });
  }

  return fragments;
};

/** Raw row shape of the album summary SELECT below. */
type AlbumRow = {
  artist: string;
  album: string;
  year: number | null;
  genre: string;
  musicCount: number;
  totalDurationMs: number;
  picturePath: string | null;
};

/**
 * List album summaries matching a filter (`mp:library:getAlbums`).
 *
 * Grouped by the album identity key; the year is the smallest non-null one,
 * genre / artwork are representatives (any non-empty value of the group).
 * The ORDER BY is only a stable base order — the article-blind artist
 * ordering is the Renderer's presentation logic (`compareNameWithoutArticle`),
 * matching the artist list's division of labor.
 *
 * @param db - The open library connection.
 * @param filter - Filter condition; an empty object lists every album.
 * @returns Matching album summaries.
 */
export const getAlbums = (
  db: DatabaseSync,
  filter: AlbumFilter,
): AlbumSummary[] => {
  const fragments = buildAlbumWhere(filter);
  const where =
    fragments.length > 0
      ? `WHERE ${fragments.map((fragment) => fragment.sql).join(" AND ")}`
      : "";
  // GROUP BY / ORDER BY repeat the artist expression: a bare `artist` would
  // resolve to the m.artist column, not the SELECT alias, splitting albums
  // whose tracks differ in track artist.
  const rows = db
    .prepare(
      `SELECT
         ${ALBUM_ARTIST_SQL} AS artist,
         m.album             AS album,
         MIN(m.year)         AS year,
         MAX(m.genre)        AS genre,
         COUNT(*)            AS musicCount,
         SUM(m.duration_ms)  AS totalDurationMs,
         MAX(p.file_path)    AS picturePath
       FROM musics m
       LEFT JOIN pictures p ON p.id = m.picture_id
       ${where}
       GROUP BY ${ALBUM_ARTIST_SQL}, m.album
       ORDER BY ${ALBUM_ARTIST_SQL}, MIN(m.year), m.album`,
    )
    .all(...fragments.flatMap((fragment) => fragment.params)) as AlbumRow[];
  return rows.map((row) => ({
    // NUL separator: cannot occur in tag strings, so ("A B", "C") and
    // ("A", "B C") can never collide. Same shape as groupAlbums' key.
    albumKey: `${row.artist}\u0000${row.album}`,
    album: row.album,
    artist: row.artist,
    year: row.year,
    genre: row.genre,
    musicCount: row.musicCount,
    totalDurationMs: row.totalDurationMs,
    picturePath: row.picturePath,
  }));
};

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
