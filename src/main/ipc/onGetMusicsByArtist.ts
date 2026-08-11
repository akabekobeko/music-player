import { getDatabase } from "../db/connection";
import { getMusicsByArtist } from "../library/getMusicsByArtist";
import type { GetMusicsByArtistRequest, IpcResult, Music } from "./types";
import { toIpcError } from "./utils/toIpcError";

/**
 * Channel handler for `mp:library:getMusicsByArtist`.
 *
 * @param _ev - Electron event object (unused).
 * @param request - Artist name from the sidebar list.
 * @returns Every track of the artist.
 */
export const onGetMusicsByArtist = async (
  _ev: Electron.IpcMainInvokeEvent,
  request: GetMusicsByArtistRequest,
): Promise<IpcResult<readonly Music[]>> => {
  try {
    return {
      ok: true,
      value: getMusicsByArtist(getDatabase(), request?.artist ?? ""),
    };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  }
};
