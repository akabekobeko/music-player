import type { MusicInfoCandidate, MusicPictureInput } from "../../ipc/types";
import type {
  Release,
  ReleaseMedium,
  ReleaseTrack,
} from "../schemas/releaseSchema";
import { genreOf } from "./genreOf";
import { joinArtistCredit } from "./joinArtistCredit";
import { publisherOf } from "./publisherOf";
import { relatedArtistsOf } from "./relatedArtistsOf";
import { workArtistsOf } from "./workArtistsOf";
import { yearOf } from "./yearOf";

/** Everything one candidate is assembled from. */
export type MusicInfoCandidateSource = {
  /** The looked-up release the track belongs to. */
  readonly release: Release;
  /** The medium holding the matched track (its position is `disc`). */
  readonly medium: ReleaseMedium;
  /** The track matched to the library song. */
  readonly track: ReleaseTrack;
  /** Search score of the hit that led to this release (0 to 100). */
  readonly score: number;
  /** Front cover fetched for the release, or `null` when there is none. */
  readonly picture: MusicPictureInput | null;
};

/**
 * Map one matched track of a looked-up release to a candidate
 * (`docs/specs/v1.2/architecture/metadata-mapping.md`,
 * `docs/specs/v1.2/architecture/musicbrainz-data-mapping.md`).
 *
 * Pure: every value comes from the parsed response. A tag MusicBrainz has
 * no value for is `null`, never the empty string, so the consumer can tell
 * "unknown" from "clear". bpm and rating are not part of a candidate.
 *
 * @param source - Release, medium, track, score and cover.
 * @returns The candidate.
 */
export const toMusicInfoCandidate = (
  source: MusicInfoCandidateSource,
): MusicInfoCandidate => {
  const { release, medium, track, score, picture } = source;
  const title = track.title.trim() !== "" ? track.title : track.recording.title;
  return {
    recordingId: track.recording.id,
    releaseId: release.id,
    score,
    tags: {
      title: title.trim() === "" ? null : title,
      artist: joinArtistCredit(track["artist-credit"]),
      albumArtist: joinArtistCredit(release["artist-credit"]),
      album: release.title.trim() === "" ? null : release.title,
      genre: genreOf(release, track),
      year: yearOf(release),
      track: track.position,
      disc: medium.position,
      composer: workArtistsOf(track, "composer"),
      lyricist: workArtistsOf(track, "lyricist"),
      producer: relatedArtistsOf(track.recording.relations, "producer"),
      conductor: relatedArtistsOf(track.recording.relations, "conductor"),
      publisher: publisherOf(release),
    },
    picture,
  };
};
