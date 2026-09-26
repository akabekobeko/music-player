/**
 * Failure codes of the MusicBrainz client
 * (`docs/specs/v1.2/architecture/musicbrainz-client.md`). IPC handlers copy
 * the code into `IpcError.code` unchanged so the Renderer can pick the
 * wording (`docs/specs/v1.2/features/music-info-fetch.md`).
 *
 * - `MB_NETWORK`: the request never got a response (DNS failure, offline).
 * - `MB_TIMEOUT`: no response within `MUSICBRAINZ_TIMEOUT_MS`.
 * - `MB_THROTTLED`: 503 on every attempt, retries exhausted.
 * - `MB_ABORTED`: the caller's `AbortSignal` cancelled the request.
 * - `MB_INVALID_RESPONSE`: the body was not JSON or failed schema parsing.
 * - `MB_HTTP_<status>`: any other non-2xx status, e.g. `MB_HTTP_404`.
 */
export type MusicBrainzErrorCode =
  | "MB_NETWORK"
  | "MB_TIMEOUT"
  | "MB_THROTTLED"
  | "MB_ABORTED"
  | "MB_INVALID_RESPONSE"
  | `MB_HTTP_${number}`;

/**
 * Failure payload of {@link MusicBrainzResult}. A plain object rather than
 * an `Error` subclass so it can be handed to `IpcError` as it is.
 */
export type MusicBrainzError = {
  /** Which failure class this is; see {@link MusicBrainzErrorCode}. */
  readonly code: MusicBrainzErrorCode;
  /** Human-readable detail (the fetch error message, the HTTP status, ...). */
  readonly message: string;
};

/**
 * Main-internal result of every MusicBrainz client call. The client never
 * throws: network, timeout, throttling and parse failures all come back
 * through the `ok: false` branch, and IPC handlers repackage them into
 * `IpcResult`.
 */
export type MusicBrainzResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: MusicBrainzError };
