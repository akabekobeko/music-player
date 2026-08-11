import { getDatabase } from "../db/connection";
import { createPlaylist } from "../playlist/createPlaylist";
import type { IpcResult, Playlist, PlaylistCreateRequest } from "./types";
import { toIpcError } from "./utils/toIpcError";

/**
 * Handler for `mp:playlist:create` — a thin request/response adapter over
 * `createPlaylist`.
 */
export const onPlaylistCreate = async (
  _ev: Electron.IpcMainInvokeEvent,
  request: PlaylistCreateRequest,
): Promise<IpcResult<Playlist>> => {
  try {
    return {
      ok: true,
      value: createPlaylist(getDatabase(), request, new Date().toISOString()),
    };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  }
};
