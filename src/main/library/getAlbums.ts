import type { DatabaseSync } from "node:sqlite";
import type { AlbumFilter, AlbumSummary } from "../ipc/types";
import { ALBUM_ARTIST_SQL } from "./ALBUM_ARTIST_SQL";
import { buildAlbumWhere } from "./buildAlbumWhere/buildAlbumWhere";

/** Raw row shape of the album summary SELECT below. */
type AlbumRow = {
  artist: string;
  album: string;
  year: number | null;
  genre: string;
  producer: string;
  conductor: string;
  publisher: string;
  musicCount: number;
  totalDurationMs: number;
  picturePath: string | null;
};

/**
 * List album summaries matching a filter (`mp:library:getAlbums`)
 * (`docs/specs/v1.0/features/album-view.md`).
 *
 * Grouped by the album identity key; the year is the smallest non-null one,
 * genre / artwork are representatives (any non-empty value of the group).
 * The ORDER BY is only a stable base order — the article-blind artist
 * ordering is the Renderer's presentation logic (`compareNameWithoutArticle`),
 * matching the artist list's division of labor.
 *
 * `AlbumSummary.albumKey` serialises the identity pair with a NUL separator —
 * the same key shape the Renderer's `groupAlbums` builds, and what
 * `mp:library:getMusicsByAlbum` decodes back.
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
         MAX(m.producer)     AS producer,
         MAX(m.conductor)    AS conductor,
         MAX(m.publisher)    AS publisher,
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
    producer: row.producer,
    conductor: row.conductor,
    publisher: row.publisher,
    musicCount: row.musicCount,
    totalDurationMs: row.totalDurationMs,
    picturePath: row.picturePath,
  }));
};
