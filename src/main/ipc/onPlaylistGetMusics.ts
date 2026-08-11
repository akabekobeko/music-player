import { getDatabase } from "../db/connection";
import { getPlaylistMusics } from "../playlist/getPlaylistMusics";
import type { IpcResult, Music, PlaylistGetMusicsRequest } from "./types";
import { toIpcError } from "./utils/toIpcError";

/**
 * Handler for `mp:playlist:getMusics` — a thin request/response adapter over
 * `getPlaylistMusics`.
 */
export const onPlaylistGetMusics = async (
  _ev: Electron.IpcMainInvokeEvent,
  request: PlaylistGetMusicsRequest,
): Promise<IpcResult<readonly Music[]>> => {
  try {
    return { ok: true, value: getPlaylistMusics(getDatabase(), request) };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  }
};
