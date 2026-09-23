import type { TagData } from "@akabeko/music-metadata-editor";
import type { MusicTagPatch } from "../../ipc/types";

/** Text fields of {@link MusicTagPatch}, keyed the same as `TagData`. */
const TEXT_FIELDS = [
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
] as const;

/**
 * Merge a {@link MusicTagPatch} into a loaded track's tag
 * (`docs/specs/v1.1/architecture/metadata-write.md`, step 3).
 *
 * How a cleared field is expressed depends on what mme's writers honour:
 * - Text: an empty string. mme's preserving writers (Vorbis Comment / APE /
 *   MP4 / ASF) treat `undefined` as "keep the existing value" and only drop
 *   a field for `""`; the rebuilding writers (ID3v2) skip both.
 * - `year`: `undefined`, plus `recordingDate` cleared. Readers derive `year`
 *   from `DATE` / `©day` / `TDRC`, so a lingering recording date would bring
 *   the old year back. Setting a year rewrites the year part of an existing
 *   recording date for the same reason.
 * - `bpm` / `rating`: `undefined`. The preserving writers cannot drop a
 *   numeric field yet (mme limitation tracked in the v1.1 spec).
 *
 * Fields absent from the patch pass through untouched, so everything Parade
 * does not model (comment, copyright, totals, …) stays in the file.
 *
 * @param tag - Tag of the track as loaded by mme.
 * @param patch - Fields to change.
 * @returns The tag to hand to `saveTrack`.
 */
export const applyTagPatch = (tag: TagData, patch: MusicTagPatch): TagData => {
  const next: TagData = { ...tag };
  for (const field of TEXT_FIELDS) {
    const value = patch[field];
    if (value !== undefined) {
      next[field] = value;
    }
  }

  if (patch.year !== undefined) {
    if (patch.year === null) {
      next.year = undefined;
      next.recordingDate = tag.recordingDate === undefined ? undefined : "";
    } else {
      next.year = patch.year;
      next.recordingDate = rewriteYearOf(tag.recordingDate, patch.year);
    }
  }

  if (patch.track !== undefined) {
    next.trackNumber = patch.track;
  }

  if (patch.disc !== undefined) {
    next.discNumber = patch.disc;
  }

  if (patch.bpm !== undefined) {
    next.bpm = patch.bpm ?? undefined;
  }

  if (patch.rating !== undefined) {
    next.rating = patch.rating ?? undefined;
  }

  return next;
};

/**
 * Replace the year part of an ISO-8601 recording date.
 *
 * A date that does not start with four digits cannot be aligned with the
 * new year, so it is cleared and the bare year wins.
 *
 * @param recordingDate - Existing `TagData.recordingDate`, if any.
 * @param year - Year to apply.
 * @returns The rewritten date, `""` to clear an unalignable one, or
 *   `undefined` when there was no recording date to begin with.
 */
const rewriteYearOf = (
  recordingDate: string | undefined,
  year: number,
): string | undefined => {
  if (recordingDate === undefined) {
    return undefined;
  }

  return /^\d{4}/.test(recordingDate)
    ? `${String(year).padStart(4, "0")}${recordingDate.slice(4)}`
    : "";
};
