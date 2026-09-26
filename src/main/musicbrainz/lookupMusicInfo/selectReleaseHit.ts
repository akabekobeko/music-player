import { SEARCH_SCORE_THRESHOLD } from "../constants";
import type {
  ReleaseSearchHit,
  ReleaseSearchResult,
} from "../schemas/releaseSearchResultSchema";

/**
 * Choose the release to look up from a release search
 * (`docs/specs/v1.2/architecture/lookup-strategy.md`): the first hit with a
 * score of at least `SEARCH_SCORE_THRESHOLD` and at least as many tracks
 * as the album group has songs. A partial selection of an album still
 * fits, a single or a promo with fewer tracks does not.
 *
 * @param result - The parsed search response.
 * @param groupSize - Number of songs in the album group.
 * @returns The chosen hit, or `null` when nothing qualifies.
 */
export const selectReleaseHit = (
  result: ReleaseSearchResult,
  groupSize: number,
): ReleaseSearchHit | null =>
  (result.releases ?? []).find(
    (hit) =>
      hit.score >= SEARCH_SCORE_THRESHOLD &&
      (hit["track-count"] ?? 0) >= groupSize,
  ) ?? null;
