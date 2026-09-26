import type { FetchMusicInfoSummary } from "@mp/ipc";
import {
  type MusicBrainzErrorKey,
  musicBrainzErrorKeyOf,
} from "@/features/musicbrainz/musicBrainzErrorKeyOf";

/**
 * One-line advice for the completion view when every failed track failed
 * for the same actionable reason (offline, timeout, throttling)
 * (`docs/specs/v1.2/features/fetch-dialog.md`). The list then shows only
 * the file names; with mixed or other causes each entry keeps its own
 * message and there is no hint.
 *
 * @param failed - The run's failures.
 * @returns The shared wording, or `null` when there is nothing to advise.
 */
export const fetchFailureHintOf = (
  failed: FetchMusicInfoSummary["failed"],
): MusicBrainzErrorKey | null => {
  const first = failed[0];
  if (first === undefined) {
    return null;
  }

  const hint = musicBrainzErrorKeyOf(first.error);
  if (hint.key === "musicbrainz.error.failed") {
    return null;
  }

  return failed.every((entry) => entry.error.code === first.error.code)
    ? hint
    : null;
};
