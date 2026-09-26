import { SEARCH_SCORE_THRESHOLD } from "../constants";
import type {
  RecordingSearchHit,
  RecordingSearchResult,
} from "../schemas/recordingSearchResultSchema";
import { isDurationClose } from "./isDurationClose";

/**
 * Choose the recording from a recording search
 * (`docs/specs/v1.2/architecture/lookup-strategy.md`): the first hit with a
 * score of at least `SEARCH_SCORE_THRESHOLD` whose length agrees with the
 * library duration when both are known.
 *
 * @param result - The parsed search response.
 * @param durationMs - Library duration of the song; 0 when unknown.
 * @returns The chosen hit, or `null` when nothing qualifies.
 */
export const selectRecordingHit = (
  result: RecordingSearchResult,
  durationMs: number,
): RecordingSearchHit | null =>
  (result.recordings ?? []).find(
    (hit) =>
      hit.score >= SEARCH_SCORE_THRESHOLD &&
      isDurationClose(durationMs, hit.length),
  ) ?? null;
