import type { DatabaseSync } from "node:sqlite";
import type { Music } from "../ipc/types";
import { ALBUM_ARTIST_SQL } from "./ALBUM_ARTIST_SQL";
import { MUSIC_COLUMNS, type MusicRow } from "./MUSIC_COLUMNS";

/**
 * All tracks of one artist (`mp:library:getMusicsByArtist`).
 *
 * Matches on the display artist (`album_artist` falling back to `artist`) —
 * the same identity `getArtists` groups by, so the sidebar entry and its
 * content always agree. The ORDER BY is only a stable base order — album
 * grouping and its year-ascending ordering are the Renderer's render-time
 * derivation (`docs/specs/v1.0/features/artist-view.md`).
 *
 * @param db - The open library connection.
 * @param artist - Display-artist name (the sidebar's list entry).
 * @returns The artist's tracks with artwork paths.
 */
export const getMusicsByArtist = (
  db: DatabaseSync,
  artist: string,
): Music[] => {
  const rows = db
    .prepare(
      `SELECT ${MUSIC_COLUMNS}
       FROM musics m
       LEFT JOIN pictures p ON p.id = m.picture_id
       WHERE ${ALBUM_ARTIST_SQL} = ?
       ORDER BY m.album, m.disc, m.track, m.title`,
    )
    .all(artist) as MusicRow[];
  return rows.map((row) => ({ ...row })) as Music[];
};
