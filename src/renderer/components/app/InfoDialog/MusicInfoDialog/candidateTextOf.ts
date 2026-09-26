import type { MusicInfoCandidate } from "@mp/ipc";
import type { CandidateField } from "./candidateFields";

/**
 * A candidate tag as the text its form input would hold
 * (`docs/specs/v1.2/features/music-info-compare.md`): numbers (year /
 * track / disc) become their decimal text so an adopted value flows
 * through `toMusicTagPatch` like a typed one.
 *
 * @param candidate - The fetched candidate.
 * @param field - The tag to read.
 * @returns The text, or `null` when MusicBrainz has no value.
 */
export const candidateTextOf = (
  candidate: MusicInfoCandidate,
  field: CandidateField,
): string | null => {
  const value = candidate.tags[field];
  return value === null ? null : String(value);
};
