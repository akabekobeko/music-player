import type { MusicBrainzError } from "../types";

/**
 * Classify a rejection of `fetch` into a client error
 * (`docs/specs/v1.2/architecture/musicbrainz-client.md`).
 *
 * The caller's own abort wins over everything else (the request was
 * cancelled on purpose); a `TimeoutError` (the reason `AbortSignal.timeout`
 * aborts with) is a timeout; anything else never reached the server and is
 * reported as a network failure.
 *
 * @param error - The value `fetch` rejected with.
 * @param signal - The caller's abort signal, if one was passed.
 * @returns The classified error.
 */
export const toFetchError = (
  error: unknown,
  signal: AbortSignal | undefined,
): MusicBrainzError => {
  if (signal?.aborted === true) {
    return { code: "MB_ABORTED", message: "The request was cancelled." };
  }

  const message = error instanceof Error ? error.message : String(error);
  if (error instanceof Error && error.name === "TimeoutError") {
    return { code: "MB_TIMEOUT", message };
  }

  return { code: "MB_NETWORK", message };
};
