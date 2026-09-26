/**
 * Base URL of the MusicBrainz web service (version 2, JSON responses)
 * (`docs/specs/v1.2/architecture/musicbrainz-client.md`).
 */
export const MUSICBRAINZ_API_BASE = "https://musicbrainz.org/ws/2";

/**
 * Host the rate limit applies to. Requests to any other host (the Cover Art
 * Archive and its archive.org redirects) skip the minimum interval wait
 * (`docs/specs/v1.2/architecture/rate-limit.md`).
 */
export const MUSICBRAINZ_HOST = "musicbrainz.org";

/** Base URL of the Cover Art Archive. */
export const COVER_ART_ARCHIVE_BASE = "https://coverartarchive.org";

/**
 * Minimum gap in ms between the start of two consecutive requests to
 * `musicbrainz.org`, app wide. Matches the "one request per second" rule of
 * the MusicBrainz API and python-musicbrainzngs's defaults; deliberately
 * not configurable (`docs/specs/v1.2/architecture/rate-limit.md`).
 */
export const MUSICBRAINZ_MIN_INTERVAL_MS = 1000;

/**
 * Per-request timeout in ms (`AbortSignal.timeout`). Expiry becomes
 * `MB_TIMEOUT`.
 */
export const MUSICBRAINZ_TIMEOUT_MS = 15000;

/**
 * Total attempts for one request when the server answers 503: the first
 * try plus two retries. Exhausting them becomes `MB_THROTTLED`.
 */
export const MUSICBRAINZ_MAX_ATTEMPTS = 3;

/**
 * Delay in ms before a retry when a 503 carries no `Retry-After` header.
 */
export const MUSICBRAINZ_DEFAULT_RETRY_DELAY_MS = 2000;

/**
 * Number of search results requested per query (`limit=`). The top hits are
 * enough because only candidates scoring at least
 * {@link SEARCH_SCORE_THRESHOLD} are considered.
 */
export const SEARCH_LIMIT = 5;

/**
 * Lowest Lucene search score (0 to 100) a release or recording hit must
 * reach to be adopted (`docs/specs/v1.2/architecture/lookup-strategy.md`).
 * Tuned in the Phase 4 QA.
 */
export const SEARCH_SCORE_THRESHOLD = 90;

/**
 * Largest allowed difference in ms between the library's duration and the
 * MusicBrainz track / recording length, covering VBR MP3 estimation error.
 */
export const DURATION_TOLERANCE_MS = 5000;

/**
 * `inc=` value of every release lookup; the same set whether the release
 * was reached through a release search or a recording search
 * (`docs/specs/v1.2/architecture/release-lookup.md`).
 *
 * `recordings` + `artist-credits` give the track list and per-track
 * artists; `labels` the publisher; `release-groups` the first release date,
 * genres and the artwork fallback id; `genres` the genre lists;
 * `artist-rels` + `recording-level-rels` the producer / conductor of each
 * recording; `work-rels` + `work-level-rels` (with `artist-rels`) the
 * composer / lyricist through the performed works.
 */
export const RELEASE_LOOKUP_INC = [
  "recordings",
  "artist-credits",
  "labels",
  "release-groups",
  "genres",
  "artist-rels",
  "recording-level-rels",
  "work-rels",
  "work-level-rels",
].join("+");

/**
 * Separator used when several people share one tag (composer, lyricist,
 * producer, conductor), the same convention as MusicBrainz Picard
 * (`docs/specs/v1.2/architecture/metadata-mapping.md`).
 */
export const NAME_SEPARATOR = ", ";
