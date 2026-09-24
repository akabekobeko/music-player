import { z } from "zod";
import { isHalfStepInRange } from "./isHalfStepInRange";
import { isIntegerInRange } from "./isIntegerInRange";

/**
 * Validation schema of the music info form
 * (`docs/specs/v1.1/features/music-info-schema.md`).
 *
 * Every form value is a string (what the input shows) or `null` (the
 * "mixed" state of a multi-track edit, which is untouched and therefore
 * exempt from every constraint). The schema only validates — it never
 * transforms, because Standard Schema validation does not write results
 * back into the form; `toMusicTagPatch` converts text to stored values at
 * apply time.
 *
 * Issue messages are i18n keys: the schema knows the ranges, the dialog
 * knows the words.
 */

/** Empty, or an integer within `[min, max]`. */
const integerText = (min: number, max: number, message: string) =>
  z
    .string()
    .refine((text) => text === "" || isIntegerInRange(text, min, max), {
      message,
    })
    .nullable();

/** Empty, or a multiple of 0.5 within `[min, max]`. */
const halfStepText = (min: number, max: number, message: string) =>
  z
    .string()
    .refine((text) => text === "" || isHalfStepInRange(text, min, max), {
      message,
    })
    .nullable();

/** A free text tag; the single-track requiredness of `title` is a field rule. */
const text = () => z.string().nullable();

export const musicInfoSchema = z.object({
  /**
   * Track title. Required for a single-track edit (a field rule, not a
   * schema rule).
   */
  title: text(),
  /** Track artist. */
  artist: text(),
  /** Album artist. */
  albumArtist: text(),
  /** Album title. */
  album: text(),
  /** Genre. */
  genre: text(),
  /** Composer. */
  composer: text(),
  /** Lyricist. */
  lyricist: text(),
  /** Producer. */
  producer: text(),
  /** Conductor. */
  conductor: text(),
  /** Publisher / record label. */
  publisher: text(),
  /**
   * Release year; empty clears it (`null`). 0 is rejected because the DB
   * stores an unknown year as `null`.
   */
  year: integerText(1, 9999, "musicInfo.error.year"),
  /** Track number; empty applies the DB default 0. */
  track: integerText(0, 9999, "musicInfo.error.track"),
  /** Disc number; empty applies the DB default 1. */
  disc: integerText(1, 999, "musicInfo.error.disc"),
  /** Beats per minute; empty clears it (`null`). */
  bpm: integerText(1, 999, "musicInfo.error.bpm"),
  /**
   * Rating as 0 to 5 stars in half steps; empty clears it (`null`).
   * `toMusicTagPatch` divides by `RATING_SCALE` to the stored `[0, 1]`.
   */
  rating: halfStepText(0, 5, "musicInfo.error.rating"),
});

/** Values of the music info form: one string (or mixed `null`) per tag. */
export type MusicInfoFormValues = z.infer<typeof musicInfoSchema>;

/** Field names of the form, in the order the Details tab shows them. */
export const MUSIC_INFO_FIELDS = [
  "title",
  "artist",
  "albumArtist",
  "album",
  "genre",
  "year",
  "track",
  "disc",
  "composer",
  "lyricist",
  "producer",
  "conductor",
  "publisher",
  "bpm",
  "rating",
] as const satisfies ReadonlyArray<keyof MusicInfoFormValues>;

/** Fields entered as numbers (rendered with a numeric input mode). */
export const NUMERIC_FIELDS: ReadonlySet<keyof MusicInfoFormValues> = new Set([
  "year",
  "track",
  "disc",
  "bpm",
  "rating",
]);
