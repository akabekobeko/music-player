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
 */
export const musicSchema = z
  .object({
    id: z.number().int(),
    /** Absolute path of the audio file. Unique within the library. */
    filePath: z.string(),
    /** Audio container format (mme's `AudioFormat`). */
    audioFormat: audioFormatSchema,
    /** Track title; the importer fills in the file name when the tag is empty. */
    title: z.string(),
    artist: z.string(),
    albumArtist: z.string(),
    album: z.string(),
    disc: z.number(),
    track: z.number(),
    /** Release year. `null` when unknown (never 0). */
    year: z.number().nullable(),
    genre: z.string(),
    composer: z.string(),
    lyricist: z.string(),
    producer: z.string(),
    conductor: z.string(),
    /** Publisher / record label. */
    publisher: z.string(),
    /** Duration reported by mme; may be inaccurate for VBR MP3 without Xing. */
    durationMs: z.number(),
    bpm: z.number().nullable(),
    /** Normalised rating in `[0, 1]`. */
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
    /** ISO-8601 timestamp of the last (re-)import. */
    updatedAt: z.string(),
  })
  .readonly();
