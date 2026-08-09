import type { DatabaseSync } from "node:sqlite";
import type { MusicRowInput } from "./trackMapping";

/**
 * `musics` upsert used by the importer
 * (`docs/specs/v1.0/architecture/database.md`).
 *
 * Re-importing the same path refreshes the metadata while `id` and
 * `added_at` survive: `ON CONFLICT(file_path) DO UPDATE` never touches
 * either (and leaves `picture_id` alone — artwork is issue #33's concern).
 */

const UPSERT_SQL = `
INSERT INTO musics (
  file_path, audio_format, title, artist, album_artist, album,
  disc, track, year, genre, composer, duration_ms, bpm, rating,
  added_at, updated_at
) VALUES (
  :filePath, :audioFormat, :title, :artist, :albumArtist, :album,
  :disc, :track, :year, :genre, :composer, :durationMs, :bpm, :rating,
  :now, :now
)
ON CONFLICT(file_path) DO UPDATE SET
  audio_format = excluded.audio_format,
  title        = excluded.title,
  artist       = excluded.artist,
  album_artist = excluded.album_artist,
  album        = excluded.album,
  disc         = excluded.disc,
  track        = excluded.track,
  year         = excluded.year,
  genre        = excluded.genre,
  composer     = excluded.composer,
  duration_ms  = excluded.duration_ms,
  bpm          = excluded.bpm,
  rating       = excluded.rating,
  updated_at   = excluded.updated_at
`;

/**
 * Insert or refresh one `musics` row.
 *
 * @param db - The open library connection.
 * @param row - Mapped column values.
 * @param now - ISO-8601 timestamp for `added_at` (insert only) / `updated_at`.
 * @returns `"inserted"` for a new row, `"updated"` for a refreshed one.
 */
export const upsertMusic = (
  db: DatabaseSync,
  row: MusicRowInput,
  now: string,
): "inserted" | "updated" => {
  const existing = db
    .prepare("SELECT 1 FROM musics WHERE file_path = ?")
    .get(row.filePath);
  db.prepare(UPSERT_SQL).run({
    filePath: row.filePath,
    audioFormat: row.audioFormat,
    title: row.title,
    artist: row.artist,
    albumArtist: row.albumArtist,
    album: row.album,
    disc: row.disc,
    track: row.track,
    year: row.year,
    genre: row.genre,
    composer: row.composer,
    durationMs: row.durationMs,
    bpm: row.bpm,
    rating: row.rating,
    now,
  });
  return existing === undefined ? "inserted" : "updated";
};
