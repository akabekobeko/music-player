/**
 * SQL expression of the display artist (`album_artist` falling back to
 * `artist`); requires the `musics` table to be aliased as `m`.
 *
 * Both identities build on it (`docs/specs/v1.0/architecture/database.md`):
 * the album identity is `(display artist, album)`, and the artist list /
 * artist-scoped queries group and match on the display artist alone.
 */
export const ALBUM_ARTIST_SQL =
  "COALESCE(NULLIF(m.album_artist, ''), m.artist)";

/**
 * Shared SELECT column list for the track queries. Rows come back in
 * camelCase with the artwork path joined from `pictures`
 * (`Music.picturePath`), so they parse with `musicSchema` as they are.
 */
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
  m.lyricist     AS lyricist,
  m.producer     AS producer,
  m.conductor    AS conductor,
  m.publisher    AS publisher,
  m.duration_ms  AS durationMs,
  m.bpm          AS bpm,
  m.rating       AS rating,
  m.picture_id   AS pictureId,
  p.file_path    AS picturePath,
  m.added_at     AS addedAt,
  m.updated_at   AS updatedAt
`;

/**
 * Audio file extensions accepted by the importer — mme core's supported
 * range (`docs/specs/v1.0/features/library.md`). Shared by the import
 * dialog's filter and the drag & drop path expansion so the two entrances
 * can never diverge.
 */
export const AUDIO_FILE_EXTENSIONS = [
  "mp3",
  "flac",
  "m4a",
  "mp4",
  "ogg",
  "opus",
  "wav",
  "aiff",
  "aif",
  "wma",
  "ape",
] as const;
