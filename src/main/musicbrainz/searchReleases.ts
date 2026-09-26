import { MUSICBRAINZ_API_BASE, SEARCH_LIMIT } from "./constants";
import type {
  MusicBrainzClient,
  MusicBrainzRequestOptions,
} from "./MusicBrainzClient/MusicBrainzClient";
import { requestJson } from "./requestJson";
import {
  type ReleaseSearchResult,
  releaseSearchResultSchema,
} from "./schemas/releaseSearchResultSchema";
import type { MusicBrainzResult } from "./types";

/**
 * Run a release search (`/ws/2/release?query=`)
 * (`docs/specs/v1.2/architecture/musicbrainz-client.md`).
 *
 * @param client - The shared client.
 * @param query - Lucene query from `buildReleaseQuery`.
 * @param options - Cancellation signal.
 * @returns The parsed hits, best first.
 */
export const searchReleases = (
  client: MusicBrainzClient,
  query: string,
  options: MusicBrainzRequestOptions = {},
): Promise<MusicBrainzResult<ReleaseSearchResult>> => {
  const params = new URLSearchParams({
    query,
    limit: String(SEARCH_LIMIT),
    fmt: "json",
  });
  return requestJson(
    client,
    `${MUSICBRAINZ_API_BASE}/release?${params}`,
    releaseSearchResultSchema,
    options,
  );
};
