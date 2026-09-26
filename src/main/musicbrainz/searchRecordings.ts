import { MUSICBRAINZ_API_BASE, SEARCH_LIMIT } from "./constants";
import type {
  MusicBrainzClient,
  MusicBrainzRequestOptions,
} from "./MusicBrainzClient/MusicBrainzClient";
import { requestJson } from "./requestJson";
import {
  type RecordingSearchResult,
  recordingSearchResultSchema,
} from "./schemas/recordingSearchResultSchema";
import type { MusicBrainzResult } from "./types";

/**
 * Run a recording search (`/ws/2/recording?query=`)
 * (`docs/specs/v1.2/architecture/musicbrainz-client.md`).
 *
 * @param client - The shared client.
 * @param query - Lucene query from `buildRecordingQuery`.
 * @param options - Cancellation signal.
 * @returns The parsed hits, best first.
 */
export const searchRecordings = (
  client: MusicBrainzClient,
  query: string,
  options: MusicBrainzRequestOptions = {},
): Promise<MusicBrainzResult<RecordingSearchResult>> => {
  const params = new URLSearchParams({
    query,
    limit: String(SEARCH_LIMIT),
    fmt: "json",
  });
  return requestJson(
    client,
    `${MUSICBRAINZ_API_BASE}/recording?${params}`,
    recordingSearchResultSchema,
    options,
  );
};
