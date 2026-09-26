import type {
  RecordingSearchHit,
  RecordingSearchRelease,
} from "../schemas/recordingSearchResultSchema";
import { normalizeTitle } from "./normalizeTitle";

/**
 * Choose which release of a recording to look up
 * (`docs/specs/v1.2/architecture/lookup-strategy.md`): the one whose title
 * matches the library's album tag, else the first `Official` one, else the
 * first listed.
 *
 * @param hit - The chosen recording search hit.
 * @param album - Library album tag; empty when unknown.
 * @returns The release to look up, or `null` when the recording lists none.
 */
export const selectRecordingRelease = (
  hit: RecordingSearchHit,
  album: string,
): RecordingSearchRelease | null => {
  const releases = hit.releases ?? [];
  if (releases.length === 0) {
    return null;
  }

  if (album.trim() !== "") {
    const wanted = normalizeTitle(album);
    const byTitle = releases.find(
      (release) => normalizeTitle(release.title) === wanted,
    );
    if (byTitle !== undefined) {
      return byTitle;
    }
  }

  return (
    releases.find((release) => release.status === "Official") ??
    releases[0] ??
    null
  );
};
