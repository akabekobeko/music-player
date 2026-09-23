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
  title: text(),
  artist: text(),
  albumArtist: text(),
  album: text(),
  genre: text(),
  composer: text(),
  lyricist: text(),
  producer: text(),
  conductor: text(),
  publisher: text(),
  year: integerText(1, 9999, "musicInfo.error.year"),
  track: integerText(0, 9999, "musicInfo.error.track"),
  disc: integerText(1, 999, "musicInfo.error.disc"),
  bpm: integerText(1, 999, "musicInfo.error.bpm"),
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
