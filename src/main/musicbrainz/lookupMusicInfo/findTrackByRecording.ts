import type { Release } from "../schemas/releaseSchema";
import type { MatchedTrack } from "./findTrackFor";

/**
 * Find the track of a looked-up release that plays a given recording, the
 * last step of the per-song fallback
 * (`docs/specs/v1.2/architecture/lookup-strategy.md`).
 *
 * @param release - The looked-up release.
 * @param recordingId - MBID of the recording chosen by the search.
 * @returns The track and medium, or `null` when the release does not list it.
 */
export const findTrackByRecording = (
  release: Release,
  recordingId: string,
): MatchedTrack | null => {
  for (const medium of release.media ?? []) {
    const track = (medium.tracks ?? []).find(
      (candidate) => candidate.recording.id === recordingId,
    );
    if (track !== undefined) {
      return { medium, track };
    }
  }

  return null;
};
