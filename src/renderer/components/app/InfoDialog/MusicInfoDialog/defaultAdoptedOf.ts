import type { MusicInfoCandidate } from "@mp/ipc";
import { missingFieldsOf } from "../../../../../shared/missingFieldsOf";
import {
  type AdoptedFields,
  CANDIDATE_FIELDS,
  NO_ADOPTED,
} from "./candidateFields";
import type { MusicInfoFormValues } from "./musicInfoSchema";
import { toMusicTagPatch } from "./toMusicTagPatch";

/**
 * Default adopt state right after a fetch
 * (`docs/specs/v1.2/features/music-info-compare.md`): on for every field
 * that is missing in the form and that the candidate has a value for, off
 * otherwise. "Missing" is the bulk fetch's rule (`missingFieldsOf`) read
 * off the form as it would be saved: the texts go through
 * `toMusicTagPatch` (trim, empty year to `null`, empty track to `0`) so
 * the defaults and the saved values can never disagree. `title` never
 * counts as missing, and `albumArtist` only when `artist` is empty too,
 * exactly as in the bulk fetch. A mixed (`null`) value counts as empty.
 *
 * @param values - The form's current values.
 * @param candidate - The fetched candidate.
 * @returns The adopt state per candidate field.
 */
export const defaultAdoptedOf = (
  values: MusicInfoFormValues,
  candidate: MusicInfoCandidate,
): AdoptedFields => {
  const texts: Partial<Record<keyof MusicInfoFormValues, string>> = {};
  for (const [key, value] of Object.entries(values)) {
    if (value !== null) {
      texts[key as keyof MusicInfoFormValues] = value;
    }
  }

  const patch = toMusicTagPatch(texts);
  const missing = missingFieldsOf({
    artist: patch.artist ?? "",
    albumArtist: patch.albumArtist ?? "",
    album: patch.album ?? "",
    genre: patch.genre ?? "",
    composer: patch.composer ?? "",
    lyricist: patch.lyricist ?? "",
    producer: patch.producer ?? "",
    conductor: patch.conductor ?? "",
    publisher: patch.publisher ?? "",
    year: patch.year ?? null,
    track: patch.track ?? 0,
  });
  const adopted = { ...NO_ADOPTED };
  for (const field of CANDIDATE_FIELDS) {
    if (
      field !== "title" &&
      missing.has(field) &&
      candidate.tags[field] !== null
    ) {
      adopted[field] = true;
    }
  }

  return adopted;
};
