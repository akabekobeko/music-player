/**
 * Shared SELECT column list for the track queries. Rows come back in
 * camelCase with the artwork path joined from `pictures`
 * (`Music.picturePath`).
 */

/** Raw row shape shared by the track SELECTs (exported for playlist queries). */
export type MusicRow = {
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

export const MUSIC_COLUMNS = `
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
