import { MUSICBRAINZ_DEFAULT_RETRY_DELAY_MS } from "../constants";

/**
 * Decide how long to wait before retrying a 503 response
 * (`docs/specs/v1.2/architecture/rate-limit.md`).
 *
 * A numeric `Retry-After` header (seconds, the form MusicBrainz sends) wins;
 * a missing, empty or non-numeric header (the HTTP-date form) falls back to
 * the default delay.
 *
 * @param retryAfter - Value of the `Retry-After` header, or `null` when absent.
 * @returns The delay in ms.
 */
export const retryDelayOf = (retryAfter: string | null): number => {
  if (retryAfter === null) {
    return MUSICBRAINZ_DEFAULT_RETRY_DELAY_MS;
  }

  const seconds = Number(retryAfter.trim());
  if (!Number.isFinite(seconds) || seconds < 0 || retryAfter.trim() === "") {
    return MUSICBRAINZ_DEFAULT_RETRY_DELAY_MS;
  }

  return seconds * 1000;
};
