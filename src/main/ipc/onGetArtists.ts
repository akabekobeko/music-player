import { getDatabase } from "../db/connection";
import { getArtists } from "../library/artistQueries";
import type { Artist, IpcResult } from "./types";
import { toIpcError } from "./utils/toIpcError";

/**
 * Channel handler for `mp:library:getArtists`.
 *
 * @param _ev - Electron event object (unused).
 * @returns Every artist with track count and artwork path.
 */
export const onGetArtists = async (
  _ev: Electron.IpcMainInvokeEvent,
): Promise<IpcResult<readonly Artist[]>> => {
  try {
    return { ok: true, value: getArtists(getDatabase()) };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  }
};
