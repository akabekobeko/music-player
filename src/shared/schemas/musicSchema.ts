import { z } from "zod";
import { audioFormatSchema } from "./audioFormatSchema";

/**
 * One track in the library. Mirrors a row of the `musics` table
 * (`docs/specs/v1.0/architecture/database.md`) in camelCase, with the
 * artwork path joined from `pictures`.
 *
 * The track SELECTs (`MUSIC_COLUMNS`) parse their rows with this schema, so
 * a row whose values drifted from the column contract (a tampered or
 * corrupted file, a bug on the write path) is reported instead of flowing
 * into the UI as a wrongly typed `Music`. The constraints are exactly the
 * type contract: integer-ness is only asserted for DB-generated ids, because
 * mme may report fractional durations and tag numbers.
 *
 * Text tags are never `null`: an unset tag is stored as the empty string
 * (`mapTrackToMusicRow`). Only year / bpm / rating distinguish "unknown" by
 * `null`.
 */
export const musicSchema = z.object({
  /** Row id of `musics`. Survives a re-import of the same path. */
  id: z.number().int(),
  /** Absolute path of the audio file. Unique within the library. */
  filePath: z.string(),
  /** Audio container format (mme's `AudioFormat`). */
  audioFormat: audioFormatSchema,
  /** Track title; the importer fills in the file name when the tag is empty. */
  title: z.string(),
  /** Track artist as tagged; empty string when unset. */
  artist: z.string(),
  /**
   * Album artist as tagged; empty string when unset. The display artist of
   * the Artist / Album views is this value falling back to `artist`.
   */
  albumArtist: z.string(),
  /** Album title as tagged; empty string when unset. */
  album: z.string(),
  /** Disc number within a multi-disc set (1-based); 1 when the tag is unset. */
  disc: z.number(),
  /** Track number within the album (1-based); 0 when the tag is unset. */
  track: z.number(),
  /** Release year. `null` when unknown (never 0). */
  year: z.number().nullable(),
  /** Genre as tagged; empty string when unset. */
  genre: z.string(),
  /** Composer as tagged; empty string when unset. */
  composer: z.string(),
  /** Lyricist as tagged; empty string when unset. */
  lyricist: z.string(),
  /** Producer as tagged; empty string when unset. */
  producer: z.string(),
  /** Conductor as tagged; empty string when unset. */
  conductor: z.string(),
  /** Publisher / record label; empty string when unset. */
  publisher: z.string(),
  /**
   * Duration reported by mme; may be inaccurate for VBR MP3 without Xing.
   * 0 when mme could not measure the file.
   */
  durationMs: z.number(),
  /** Beats per minute as tagged. `null` when unset. */
  bpm: z.number().nullable(),
  /**
   * Rating normalised by mme to `[0, 1]` regardless of the tag format's own
   * scale. `null` when unset. The music info dialog shows it as 0 to 5 stars
   * in half steps.
   */
  rating: z.number().nullable(),
  /** Artwork reference into the `pictures` table. */
  pictureId: z.number().int().nullable(),
  /**
   * Absolute artwork path joined from `pictures.file_path`, or `null`.
   * Renderer turns this into a `media-file://` URL (PlayerBar, track lists).
   */
  picturePath: z.string().nullable(),
  /** ISO-8601 timestamp the track was first imported. */
  addedAt: z.string(),
  /**
   * ISO-8601 timestamp of the last write to the row: a re-import of the
   * same path or a tag edit through the music info dialog.
   */
  updatedAt: z.string(),
});
