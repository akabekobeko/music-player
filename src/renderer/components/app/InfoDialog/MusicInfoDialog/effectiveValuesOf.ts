import type { MusicInfoCandidate } from "@mp/ipc";
import { type AdoptedFields, CANDIDATE_FIELDS } from "./candidateFields";
import { candidateTextOf } from "./candidateTextOf";
import type { MusicInfoFormValues } from "./musicInfoSchema";

/**
 * The values an apply would save
 * (`docs/specs/v1.2/features/music-info-compare.md`): the form's current
 * values with every adopted field replaced by the candidate's text. Fed to
 * `diffFormValues` for the change check and to `toMusicTagPatch` at apply
 * time, so an adopted value takes the same road as a typed one.
 *
 * @param values - The form's current values.
 * @param candidate - The fetched candidate, or `null` before a fetch.
 * @param adopted - Which candidate fields are adopted.
 * @returns The effective values.
 */
export const effectiveValuesOf = (
  values: MusicInfoFormValues,
  candidate: MusicInfoCandidate | null,
  adopted: AdoptedFields,
): MusicInfoFormValues => {
  if (candidate === null) {
    return values;
  }

  const effective = { ...values };
  for (const field of CANDIDATE_FIELDS) {
    const text = adopted[field] ? candidateTextOf(candidate, field) : null;
    if (text !== null) {
      effective[field] = text;
    }
  }

  return effective;
};
