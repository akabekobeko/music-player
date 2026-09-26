import type { Music } from "../../ipc/types";
import type {
  Release,
  ReleaseMedium,
  ReleaseTrack,
} from "../schemas/releaseSchema";
import { isDurationClose } from "./isDurationClose";
import { normalizeTitle } from "./normalizeTitle";

/** A track of a release together with the medium it sits on. */
export type MatchedTrack = {
  /** The medium (disc) holding the track. */
  readonly medium: ReleaseMedium;
  /** The matched track. */
  readonly track: ReleaseTrack;
};

/** The library tags the track matching reads. */
export type TrackMatchInput = Pick<
  Music,
  "title" | "disc" | "track" | "durationMs"
>;

/**
 * Find the track of a looked-up release that corresponds to one library
 * song (`docs/specs/v1.2/architecture/lookup-strategy.md`).
 *
 * With a track number, the disc and track positions decide. Without one,
 * a normalised title match whose length agrees with the library duration
 * (or where either is unknown) decides. No match means the song falls back
 * to the per-song recording search.
 *
 * @param release - The looked-up release.
 * @param music - The library song.
 * @returns The matched track and medium, or `null`.
 */
export const findTrackFor = (
  release: Release,
  music: TrackMatchInput,
): MatchedTrack | null => {
  const media = release.media ?? [];
  if (music.track > 0) {
    for (const medium of media) {
      if (medium.position !== music.disc) {
        continue;
      }

      const track = (medium.tracks ?? []).find(
        (candidate) => candidate.position === music.track,
      );
      if (track !== undefined) {
        return { medium, track };
      }
    }

    return null;
  }

  const title = normalizeTitle(music.title);
  for (const medium of media) {
    for (const track of medium.tracks ?? []) {
      if (
        normalizeTitle(track.title) === title &&
        isDurationClose(
          music.durationMs,
          track.length ?? track.recording.length,
        )
      ) {
        return { medium, track };
      }
    }
  }

  return null;
};
