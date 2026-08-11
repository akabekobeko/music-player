import type { DatabaseSync } from "node:sqlite";
import type { Music } from "../ipc/types";
import { MUSIC_COLUMNS, type MusicRow } from "./MUSIC_COLUMNS";

/**
 * All tracks of one album in play order (`mp:library:getMusicsByAlbum`).
 *
 * @param db - The open library connection.
 * @param albumKey - Identity key from `AlbumSummary.albumKey`: the display
 *   artist and album name joined with a NUL separator (`getAlbums`).
 * @returns The album's tracks (disc → track order), or an empty list for a
 *   malformed key.
 */
export const getMusicsByAlbum = (
  db: DatabaseSync,
  albumKey: string,
): Music[] => {
  const separator = albumKey.indexOf("\u0000");
  if (separator < 0) {
    return [];
  }

  const artist = albumKey.slice(0, separator);
  const album = albumKey.slice(separator + 1);
  const rows = db
    .prepare(
      `SELECT ${MUSIC_COLUMNS}
       FROM musics m
       LEFT JOIN pictures p ON p.id = m.picture_id
       WHERE COALESCE(NULLIF(m.album_artist, ''), m.artist) = ? AND m.album = ?
       ORDER BY m.disc, m.track, m.title`,
    )
    .all(artist, album) as MusicRow[];
  return rows.map((row) => ({ ...row })) as Music[];
};
