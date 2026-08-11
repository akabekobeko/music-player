import { getDatabase } from "../db/connection";
import { updatePlaylist } from "../playlist/updatePlaylist";
import type { IpcResult, Playlist, PlaylistUpdateRequest } from "./types";
import { toIpcError } from "./utils/toIpcError";

/**
 * Handler for `mp:playlist:update` — a thin request/response adapter over
 * `updatePlaylist`.
 */
export const onPlaylistUpdate = async (
  _ev: Electron.IpcMainInvokeEvent,
  request: PlaylistUpdateRequest,
): Promise<IpcResult<Playlist>> => {
  try {
    return {
      ok: true,
      value: updatePlaylist(getDatabase(), request, new Date().toISOString()),
    };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  }
};
