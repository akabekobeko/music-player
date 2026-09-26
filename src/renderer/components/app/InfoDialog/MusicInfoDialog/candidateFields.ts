import type { MusicInfoCandidateTags } from "@mp/ipc";

/** A tag the MusicBrainz candidate can supply (never bpm / rating). */
export type CandidateField = keyof MusicInfoCandidateTags;

/** Adopt state of the compare view: which fetched values will be saved. */
export type AdoptedFields = Readonly<Record<CandidateField, boolean>>;

/**
 * Nothing adopted; the state before a fetch and the base of the defaults.
 * Also the single definition of the candidate field set: the iteration
 * order below is the Details tab's order.
 */
export const NO_ADOPTED: AdoptedFields = {
  title: false,
  artist: false,
  albumArtist: false,
  album: false,
  genre: false,
  year: false,
  track: false,
  disc: false,
  composer: false,
  lyricist: false,
  producer: false,
  conductor: false,
  publisher: false,
};

/** The candidate fields, in the Details tab's order. */
export const CANDIDATE_FIELDS = Object.keys(
  NO_ADOPTED,
) as readonly CandidateField[];

/** Whether a form field name is one the candidate can supply. */
export const isCandidateField = (name: string): name is CandidateField =>
  Object.hasOwn(NO_ADOPTED, name);
