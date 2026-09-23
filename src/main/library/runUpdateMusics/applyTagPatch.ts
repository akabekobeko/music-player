import type { TagData, TagPatch } from "@akabeko/music-metadata-editor";
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
 * A cleared field becomes `null`, mme's explicit deletion marker
 * (`TagPatch`): `undefined` would mean "keep what the file has" for the
 * preserving writers (Vorbis Comment / APE / MP4 / ASF).
 *
 * `year` needs care because readers derive it from the recording date
 * (`DATE` / `©day` / `TDRC`) and mme keeps that sibling when only the year
 * is cleared: clearing the year clears the recording date too, and setting
 * a year rewrites the year part of an existing recording date so the two
 * never disagree.
 *
 * Fields absent from the patch pass through untouched, so everything Parade
 * does not model (comment, copyright, totals, …) stays in the file.
 *
 * @param tag - Tag of the track as loaded by mme.
 * @param patch - Fields to change.
 * @returns The tag to hand to `saveTrack`.
 */
export const applyTagPatch = (tag: TagData, patch: MusicTagPatch): TagPatch => {
  const next: TagPatch = { ...tag };
  for (const field of TEXT_FIELDS) {
    const value = patch[field];
    if (value !== undefined) {
      next[field] = value === "" ? null : value;
    }
  }

  if (patch.year !== undefined) {
    if (patch.year === null) {
      next.year = null;
      next.recordingDate = null;
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
    next.bpm = patch.bpm;
  }

  if (patch.rating !== undefined) {
    next.rating = patch.rating;
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
 * @returns The rewritten date, `null` to clear an unalignable one, or
 *   `undefined` when there was no recording date to begin with.
 */
const rewriteYearOf = (
  recordingDate: string | undefined,
  year: number,
): string | null | undefined => {
  if (recordingDate === undefined) {
    return undefined;
  }

  return /^\d{4}/.test(recordingDate)
    ? `${String(year).padStart(4, "0")}${recordingDate.slice(4)}`
    : null;
};
