import type { MusicTagPatch } from "@mp/ipc";
import { RATING_SCALE } from "./formValuesOf";
import type { MusicInfoFormValues } from "./musicInfoSchema";

/**
 * Convert changed form values to the patch `mp:library:updateMusics`
 * expects (`docs/specs/v1.1/features/music-info-fields.md`).
 *
 * Text fields are trimmed; an empty text clears the tag. Numeric fields
 * parse their text — empty means `null` (clear) for year / bpm / rating,
 * and the DB defaults `0` / `1` for track / disc. The rating goes from the
 * 5-star scale back to mme's normalised `[0, 1]`. Values are assumed valid
 * (the form blocks Apply otherwise).
 *
 * @param changed - Changed fields from `diffFormValues`.
 * @returns The patch with exactly those fields.
 */
export const toMusicTagPatch = (
  changed: Partial<Record<keyof MusicInfoFormValues, string>>,
): MusicTagPatch => {
  const patch: {
    -readonly [K in keyof MusicTagPatch]: MusicTagPatch[K];
  } = {};
  const text = (key: TextField): void => {
    const value = changed[key];
    if (value !== undefined) {
      patch[key] = value.trim();
    }
  };
  for (const key of TEXT_FIELDS) {
    text(key);
  }

  if (changed.year !== undefined) {
    patch.year = changed.year === "" ? null : Number(changed.year);
  }

  if (changed.track !== undefined) {
    patch.track = changed.track === "" ? 0 : Number(changed.track);
  }

  if (changed.disc !== undefined) {
    patch.disc = changed.disc === "" ? 1 : Number(changed.disc);
  }

  if (changed.bpm !== undefined) {
    patch.bpm = changed.bpm === "" ? null : Number(changed.bpm);
  }

  if (changed.rating !== undefined) {
    patch.rating =
      changed.rating === "" ? null : Number(changed.rating) / RATING_SCALE;
  }

  return patch;
};

type TextField =
  | "title"
  | "artist"
  | "albumArtist"
  | "album"
  | "genre"
  | "composer"
  | "lyricist"
  | "producer"
  | "conductor"
  | "publisher";

const TEXT_FIELDS: readonly TextField[] = [
  "title",
  "artist",
  "albumArtist",
  "album",
  "genre",
  "composer",
  "lyricist",
  "producer",
  "conductor",
  "publisher",
];
