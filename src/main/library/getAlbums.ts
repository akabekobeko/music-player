import type { DatabaseSync } from "node:sqlite";
import { albumSummarySchema } from "../../shared/schemas/albumSummarySchema";
import type { AlbumFilter, AlbumSummary } from "../ipc/types";
import { ALBUM_ARTIST_SQL } from "./ALBUM_ARTIST_SQL";
import { albumKeyOf } from "./albumKeyOf";
import { buildAlbumWhere } from "./buildAlbumWhere/buildAlbumWhere";

/** Row shape of the album summary SELECT below: the summary minus the derived key. */
const albumRowSchema = albumSummarySchema.omit({ albumKey: true });

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
  const rows = albumRowSchema.array().parse(
    db
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
      .all(...fragments.flatMap((fragment) => fragment.params)),
  );
  return rows.map((row) => ({
    albumKey: albumKeyOf(row.artist, row.album),
    ...row,
  }));
};
