import { getDatabase } from "../db/connection";
import { removePlaylist } from "../playlist/removePlaylist";
import type { IpcResult, PlaylistRemoveRequest } from "./types";
import { toIpcError } from "./utils/toIpcError";

/**
 * Handler for `mp:playlist:remove` — a thin request/response adapter over
 * `removePlaylist`.
 */
export const onPlaylistRemove = async (
  _ev: Electron.IpcMainInvokeEvent,
  request: PlaylistRemoveRequest,
): Promise<IpcResult<void>> => {
  try {
    removePlaylist(getDatabase(), request);
    return { ok: true, value: undefined };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  }
};
