import type { MusicInfoCandidate } from "@mp/ipc";
import {
  type MissingFieldsInput,
  missingFieldsOf,
} from "../../../../../shared/missingFieldsOf";
import {
  type AdoptedFields,
  CANDIDATE_FIELDS,
  NO_ADOPTED,
} from "./candidateFields";
import type { MusicInfoFormValues } from "./musicInfoSchema";

/**
 * Default adopt state right after a fetch
 * (`docs/specs/v1.2/features/music-info-compare.md`): on for every field
 * that is missing in the form and that the candidate has a value for, off
 * otherwise. "Missing" is the bulk fetch's rule (`missingFieldsOf`) read
 * off the form: a text that trims to nothing, an empty year, a track of
 * `""` or `"0"`. `title` never counts as missing, and `albumArtist` only
 * when `artist` is empty too, exactly as in the bulk fetch, so the two
 * entrances propose the same completions.
 *
 * @param values - The form's current values.
 * @param candidate - The fetched candidate.
 * @returns The adopt state per candidate field.
 */
export const defaultAdoptedOf = (
  values: MusicInfoFormValues,
  candidate: MusicInfoCandidate,
): AdoptedFields => {
  const missing = missingFieldsOf(toMissingInput(values));
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

/** Read the form texts as the stored-value shape the missing rule expects. */
const toMissingInput = (values: MusicInfoFormValues): MissingFieldsInput => {
  const text = (value: string | null): string => value?.trim() ?? "";
  const year = text(values.year);
  const track = text(values.track);
  return {
    artist: text(values.artist),
    albumArtist: text(values.albumArtist),
    album: text(values.album),
    genre: text(values.genre),
    composer: text(values.composer),
    lyricist: text(values.lyricist),
    producer: text(values.producer),
    conductor: text(values.conductor),
    publisher: text(values.publisher),
    year: year === "" ? null : Number(year),
    track: track === "" ? 0 : Number(track),
  };
};
