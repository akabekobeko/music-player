import { missingFieldsOf } from "../../shared/missingFieldsOf";
import type {
  Music,
  MusicInfoCandidate,
  MusicPictureInput,
  MusicTagPatch,
} from "../ipc/types";

/** What a bulk fetch would write for one track. */
export type MissingPatch = {
  /** Missing fields the candidate has a value for; empty when none. */
  readonly patch: MusicTagPatch;
  /**
   * The candidate's cover when the track has no artwork and the candidate
   * has one; `undefined` otherwise (leave the artwork untouched).
   */
  readonly picture: MusicPictureInput | undefined;
};

/**
 * Build the write of a bulk fetch for one track
 * (`docs/specs/v1.2/features/missing-fields.md`): only the fields
 * `missingFieldsOf` reports, and only those the candidate has a value for.
 * Existing values are never overwritten; overwriting is the music info
 * dialog's job. Strings are trimmed like every `MusicTagPatch`, and a value
 * that trims to nothing is left out because an empty string would clear
 * the tag.
 *
 * @param music - The track as stored.
 * @param candidate - The MusicBrainz candidate.
 * @returns The patch and picture; both empty means "unchanged".
 */
export const missingPatchOf = (
  music: Music,
  candidate: MusicInfoCandidate,
): MissingPatch => {
  const patch: Record<string, string | number> = {};
  for (const field of missingFieldsOf(music)) {
    const value = candidate.tags[field];
    if (value === null) {
      continue;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed !== "") {
        patch[field] = trimmed;
      }
    } else {
      patch[field] = value;
    }
  }

  return {
    patch,
    picture:
      music.picturePath === null && candidate.picture !== null
        ? candidate.picture
        : undefined,
  };
};
