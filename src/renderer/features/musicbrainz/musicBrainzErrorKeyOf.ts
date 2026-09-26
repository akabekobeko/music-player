import type { IpcError } from "@mp/ipc";

/**
 * How a MusicBrainz failure is classified for the user: the three causes
 * they can act on, or anything else.
 */
export type MusicBrainzErrorKind =
  | "network"
  | "timeout"
  | "throttled"
  | "other";

/** An i18n key plus its parameters, resolved by the component's `t`. */
export type MusicBrainzErrorKey = {
  /** The classification the key was chosen for. */
  readonly kind: MusicBrainzErrorKind;
  /** Dictionary key of the message. */
  readonly key: string;
  /** Interpolation parameters, if the message has any. */
  readonly params?: Readonly<Record<string, string>>;
};

/**
 * Pick the wording of a failed MusicBrainz request, shared by the music
 * info dialog's fetch button and the bulk fetch's failure list so the two
 * entrances describe the same failure with the same words
 * (`docs/specs/v1.2/features/music-info-fetch.md`,
 * `docs/specs/v1.2/features/fetch-dialog.md`).
 *
 * The three failures the user can act on get their own sentence with the
 * retry advice: no connection, no answer in time, and throttling. Anything
 * else (`kind: "other"`) falls back to the raw message; callers that also
 * see non-MusicBrainz failures (a write error of the bulk fetch) show the
 * message on its own for that kind.
 *
 * @param error - The failure returned by a `mp:musicbrainz:*` channel or
 *   recorded under one track of a bulk fetch.
 * @returns The classification, message key and parameters.
 */
export const musicBrainzErrorKeyOf = (error: IpcError): MusicBrainzErrorKey => {
  switch (error.code) {
    case "MB_NETWORK":
      return { kind: "network", key: "musicbrainz.error.network" };
    case "MB_TIMEOUT":
      return { kind: "timeout", key: "musicbrainz.error.timeout" };
    case "MB_THROTTLED":
      return { kind: "throttled", key: "musicbrainz.error.throttled" };
    default:
      return {
        kind: "other",
        key: "musicbrainz.error.failed",
        params: { message: error.message },
      };
  }
};
