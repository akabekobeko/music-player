import type { DatabaseSync } from "node:sqlite";
import type { Music } from "../ipc/types";

/**
 * Track queries for the library views. Rows come back in camelCase with the
 * artwork path joined from `pictures` (`Music.picturePath`).
 */

/** Raw row shape shared by the track SELECTs below. */
type MusicRow = {
  id: number;
  filePath: string;
  audioFormat: string;
  title: string;
  artist: string;
  albumArtist: string;
  album: string;
  disc: number;
  track: number;
  year: number | null;
  genre: string;
  composer: string;
  durationMs: number;
  bpm: number | null;
  rating: number | null;
  pictureId: number | null;
  picturePath: string | null;
  addedAt: string;
  updatedAt: string;
};

const MUSIC_COLUMNS = `
  m.id           AS id,
  m.file_path    AS filePath,
  m.audio_format AS audioFormat,
  m.title        AS title,
  m.artist       AS artist,
  m.album_artist AS albumArtist,
  m.album        AS album,
  m.disc         AS disc,
  m.track        AS track,
  m.year         AS year,
  m.genre        AS genre,
  m.composer     AS composer,
  m.duration_ms  AS durationMs,
  m.bpm          AS bpm,
  m.rating       AS rating,
  m.picture_id   AS pictureId,
  p.file_path    AS picturePath,
  m.added_at     AS addedAt,
  m.updated_at   AS updatedAt
`;

/**
 * All tracks of one artist (`mp:library:getMusicsByArtist`).
 *
 * The ORDER BY is only a stable base order — album grouping and its
 * year-ascending ordering are the Renderer's render-time derivation
 * (`docs/specs/v1.0/features/artist-view.md`).
 *
 * @param db - The open library connection.
 * @param artist - Exact `musics.artist` value (the sidebar's list entry).
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
       WHERE m.artist = ?
       ORDER BY m.album, m.disc, m.track, m.title`,
    )
    .all(artist) as MusicRow[];
  return rows.map((row) => ({ ...row })) as Music[];
};

/**
 * All tracks of one album in play order (`mp:library:getMusicsByAlbum`).
 *
 * @param db - The open library connection.
 * @param albumKey - Identity key from `AlbumSummary.albumKey`: the display
 *   artist and album name joined with a NUL separator (`albumQueries`).
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
