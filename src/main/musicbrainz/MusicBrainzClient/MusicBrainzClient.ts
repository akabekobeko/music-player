import { net } from "electron";
import {
  MUSICBRAINZ_HOST,
  MUSICBRAINZ_MAX_ATTEMPTS,
  MUSICBRAINZ_MAX_RETRY_DELAY_MS,
  MUSICBRAINZ_MIN_INTERVAL_MS,
  MUSICBRAINZ_TIMEOUT_MS,
} from "../constants";
import type { MusicBrainzResult } from "../types";
import { abortableSleep } from "./abortableSleep";
import { retryDelayOf } from "./retryDelayOf";
import { toFetchError } from "./toFetchError";

/** Request options accepted by {@link MusicBrainzClient.request}. */
export type MusicBrainzRequestOptions = {
  /**
   * Caller-side cancellation (the bulk fetch's cancel). An aborted request
   * resolves to `MB_ABORTED`, also while it is waiting for the minimum
   * interval or a retry; the queue moves on to the next request.
   */
  readonly signal?: AbortSignal;
};

/** Injectable seams (Electron's `net.fetch` and real timers in production). */
export type MusicBrainzClientDeps = {
  /** HTTP transport; `net.fetch` so the OS proxy settings are honoured. */
  readonly fetch: (
    url: string,
    init: {
      /** Request headers (`User-Agent`, `Accept`). */
      readonly headers: Readonly<Record<string, string>>;
      /** Timeout combined with the caller's signal. */
      readonly signal: AbortSignal;
    },
  ) => Promise<Response>;
  /** Monotonic clock in ms, compared against the last request start. */
  readonly now: () => number;
  /**
   * Delay helper that returns early when `signal` aborts; tests replace it
   * with a virtual clock.
   */
  readonly sleep: (ms: number, signal?: AbortSignal) => Promise<void>;
  /**
   * Sink for one line per completed request (status and URL, never the
   * body), used to read the request spacing off the log during the
   * rate-limit QA. Absent means silent; the singleton wires it up in
   * development only.
   */
  readonly log?: (line: string) => void;
};

/** Production seams without a log sink (the singleton adds one in development). */
export const DEFAULT_CLIENT_DEPS: MusicBrainzClientDeps = {
  fetch: (url, init) => net.fetch(url, init),
  now: () => performance.now(),
  sleep: abortableSleep,
};

const ABORTED: MusicBrainzResult<never> = {
  ok: false,
  error: { code: "MB_ABORTED", message: "The request was cancelled." },
};

/**
 * HTTP client for the MusicBrainz API and the Cover Art Archive
 * (`docs/specs/v1.2/architecture/musicbrainz-client.md`).
 *
 * Every request goes through one app-wide queue: requests run strictly one
 * after another, and a request to `musicbrainz.org` starts at least
 * `MUSICBRAINZ_MIN_INTERVAL_MS` after the previous one started, whichever
 * caller issued it. That is what keeps the app inside the "one request per
 * second" rule even when the bulk fetch and the dialog fetch overlap
 * (`docs/specs/v1.2/architecture/rate-limit.md`). Requests to other hosts
 * share the queue (and the user agent and timeout) but never wait.
 *
 * A 503 is retried after `Retry-After` (or a default delay) while holding
 * the queue, so the whole app slows down instead of piling up; a
 * `Retry-After` beyond `MUSICBRAINZ_MAX_RETRY_DELAY_MS` gives up at once.
 * The client never throws and never lets one failure block the queue:
 * every outcome, including an unexpected exception, is a
 * {@link MusicBrainzResult}.
 *
 * A class because the queue tail and the last start time are shared,
 * mutable state.
 */
export class MusicBrainzClient {
  readonly #userAgent: string;
  readonly #deps: MusicBrainzClientDeps;
  /** Tail of the queue; the next request chains onto it. Never rejects. */
  #tail: Promise<void> = Promise.resolve();
  /** Start time (`deps.now()`) of the last `musicbrainz.org` request. */
  #lastStartedAt = Number.NEGATIVE_INFINITY;

  /**
   * @param userAgent - Value of the `User-Agent` header (`buildUserAgent`).
   * @param deps - Injectable seams; omit for production defaults.
   */
  constructor(
    userAgent: string,
    deps: MusicBrainzClientDeps = DEFAULT_CLIENT_DEPS,
  ) {
    this.#userAgent = userAgent;
    this.#deps = deps;
  }

  /**
   * Issue one GET request through the queue.
   *
   * Resolves with the raw `Response` for a 2xx status. Any other outcome
   * (network failure, timeout, exhausted 503 retries, other statuses,
   * cancellation) resolves with the `ok: false` branch; the body of a
   * failed response is not read.
   *
   * @param url - Absolute URL to fetch.
   * @param options - Cancellation signal.
   * @returns The response or the classified failure.
   */
  request(
    url: string,
    options: MusicBrainzRequestOptions = {},
  ): Promise<MusicBrainzResult<Response>> {
    const run = this.#tail.then(() => this.#execute(url, options.signal));
    // Both branches are swallowed: a rejected tail would skip every later
    // request's `then` and poison the queue for the rest of the session.
    this.#tail = run.then(noop, noop);
    return run;
  }

  /** {@link MusicBrainzClient.attempts} with a last-resort exception guard. */
  async #execute(
    url: string,
    signal: AbortSignal | undefined,
  ): Promise<MusicBrainzResult<Response>> {
    try {
      return await this.#attempts(url, signal);
    } catch (error) {
      const failure = toFetchError(error, signal);
      console.warn(`[musicbrainz] ${failure.code} ${url}: ${failure.message}`);
      return { ok: false, error: failure };
    }
  }

  async #attempts(
    url: string,
    signal: AbortSignal | undefined,
  ): Promise<MusicBrainzResult<Response>> {
    const rateLimited = new URL(url).hostname === MUSICBRAINZ_HOST;

    for (let attempt = 1; ; attempt += 1) {
      if (isAborted(signal)) {
        return ABORTED;
      }

      if (rateLimited) {
        const wait =
          this.#lastStartedAt + MUSICBRAINZ_MIN_INTERVAL_MS - this.#deps.now();
        if (wait > 0) {
          await this.#deps.sleep(wait, signal);
          if (isAborted(signal)) {
            return ABORTED;
          }
        }

        this.#lastStartedAt = this.#deps.now();
      }

      let response: Response;
      try {
        response = await this.#deps.fetch(url, {
          headers: {
            "User-Agent": this.#userAgent,
            Accept: "application/json",
          },
          signal: combineSignals(signal),
        });
      } catch (error) {
        const failure = toFetchError(error, signal);
        console.warn(
          `[musicbrainz] ${failure.code} ${url}: ${failure.message}`,
        );
        return { ok: false, error: failure };
      }

      if (response.status === 503) {
        const delay = retryDelayOf(response.headers.get("Retry-After"));
        if (
          attempt < MUSICBRAINZ_MAX_ATTEMPTS &&
          delay <= MUSICBRAINZ_MAX_RETRY_DELAY_MS
        ) {
          console.warn(
            `[musicbrainz] 503 ${url}: retrying in ${delay} ms (attempt ${attempt})`,
          );
          await this.#deps.sleep(delay, signal);
          if (isAborted(signal)) {
            return ABORTED;
          }

          continue;
        }

        console.warn(
          `[musicbrainz] 503 ${url}: giving up (Retry-After ${delay} ms)`,
        );
        return {
          ok: false,
          error: {
            code: "MB_THROTTLED",
            message: `Service unavailable after ${attempt} attempt(s).`,
          },
        };
      }

      if (!response.ok) {
        console.warn(`[musicbrainz] ${response.status} ${url}`);
        return {
          ok: false,
          error: {
            code: `MB_HTTP_${response.status}`,
            message: `${response.status} ${response.statusText}`.trim(),
          },
        };
      }

      this.#deps.log?.(`[musicbrainz] ${response.status} ${url}`);
      return { ok: true, value: response };
    }
  }
}

const noop = (): void => {};

/** Re-read the live flag; TS would otherwise keep an earlier narrowing. */
const isAborted = (signal: AbortSignal | undefined): boolean =>
  signal?.aborted === true;

/** Timeout signal, joined with the caller's signal when there is one. */
const combineSignals = (signal: AbortSignal | undefined): AbortSignal => {
  const timeout = AbortSignal.timeout(MUSICBRAINZ_TIMEOUT_MS);
  return signal === undefined ? timeout : AbortSignal.any([timeout, signal]);
};
