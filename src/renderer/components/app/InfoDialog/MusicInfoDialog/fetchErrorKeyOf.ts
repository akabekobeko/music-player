import type { IpcError } from "@mp/ipc";

/** An i18n key plus its parameters, resolved by the component's `t`. */
export type FetchErrorKey = {
  /** Dictionary key of the message. */
  readonly key: string;
  /** Interpolation parameters, if the message has any. */
  readonly params?: Readonly<Record<string, string>>;
};

/**
 * Pick the wording of a failed fetch
 * (`docs/specs/v1.2/features/music-info-fetch.md`): the network / timeout
 * codes read as "offline", throttling as "busy, retry later", and
 * everything else shows the raw message.
 *
 * @param error - The failure returned by `mp:musicbrainz:lookupMusic`.
 * @returns The message key and parameters.
 */
export const fetchErrorKeyOf = (error: IpcError): FetchErrorKey => {
  switch (error.code) {
    case "MB_NETWORK":
    case "MB_TIMEOUT":
      return { key: "musicInfo.fetchNetwork" };
    case "MB_THROTTLED":
      return { key: "musicInfo.fetchThrottled" };
    default:
      return {
        key: "musicInfo.fetchFailed",
        params: { message: error.message },
      };
  }
};
