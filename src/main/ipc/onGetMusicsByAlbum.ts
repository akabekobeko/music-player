import { getDatabase } from "../db/connection";
import { getMusicsByAlbum } from "../library/musicQueries";
import type { GetMusicsByAlbumRequest, IpcResult, Music } from "./types";
import { toIpcError } from "./utils/toIpcError";

/**
 * Channel handler for `mp:library:getMusicsByAlbum`.
 *
 * @param _ev - Electron event object (unused).
 * @param request - Album identity key to resolve.
 * @returns The album's tracks in disc → track order.
 */
export const onGetMusicsByAlbum = async (
  _ev: Electron.IpcMainInvokeEvent,
  request: GetMusicsByAlbumRequest,
): Promise<IpcResult<readonly Music[]>> => {
  try {
    return {
      ok: true,
      value: getMusicsByAlbum(getDatabase(), request.albumKey),
    };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  }
};
