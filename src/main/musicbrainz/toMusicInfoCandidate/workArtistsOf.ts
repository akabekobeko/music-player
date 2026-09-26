import { NAME_SEPARATOR } from "../constants";
import type { ReleaseTrack } from "../schemas/releaseSchema";
import { relatedArtistsOf } from "./relatedArtistsOf";

/**
 * Collect artists related to the works a recording performs
 * (`docs/specs/v1.2/architecture/metadata-mapping.md`): follow every
 * `work` relationship of the recording, read the work's artist
 * relationships of `type`, and merge the names across works (a medley
 * performs several) without duplicates.
 *
 * @param track - The matched track.
 * @param type - Work relationship name (`"composer"` or `"lyricist"`).
 * @returns The joined names, or `null` when no work names anyone.
 */
export const workArtistsOf = (
  track: ReleaseTrack,
  type: string,
): string | null => {
  const names: string[] = [];
  for (const relation of track.recording.relations ?? []) {
    if (relation["target-type"] !== "work" || relation.work === undefined) {
      continue;
    }

    const joined = relatedArtistsOf(relation.work.relations, type);
    if (joined === null) {
      continue;
    }

    for (const name of joined.split(NAME_SEPARATOR)) {
      if (!names.includes(name)) {
        names.push(name);
      }
    }
  }

  return names.length === 0 ? null : names.join(NAME_SEPARATOR);
};
