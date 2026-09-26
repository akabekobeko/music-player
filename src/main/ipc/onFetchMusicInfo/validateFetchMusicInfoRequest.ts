import type { FetchMusicInfoRequest, IpcError } from "../types";

/**
 * Validate a `mp:musicbrainz:fetchMusicInfo` request before anything runs
 * (`docs/specs/v1.2/architecture/ipc-types.md`). Only structural problems
 * are rejected here: an empty or duplicated id list. Ids that are not in
 * the library are reported per track by the run itself.
 *
 * @param request - Raw payload received over IPC.
 * @returns `null` when the request is acceptable, otherwise the error to
 *   return as `{ ok: false }`.
 */
export const validateFetchMusicInfoRequest = (
  request: FetchMusicInfoRequest | undefined,
): IpcError | null => {
  if (request === undefined || request === null) {
    return invalid("The request is missing.");
  }

  const { musicIds } = request;
  if (!Array.isArray(musicIds) || musicIds.length === 0) {
    return invalid("At least one music id is required.");
  }

  if (!musicIds.every((id) => Number.isInteger(id))) {
    return invalid("Music ids must be integers.");
  }

  if (new Set(musicIds).size !== musicIds.length) {
    return invalid("Music ids must not repeat.");
  }

  return null;
};

const invalid = (message: string): IpcError => ({
  name: "Error",
  code: "INVALID_REQUEST",
  message,
});
