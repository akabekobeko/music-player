import { getDatabase } from "../db/connection";
import { listPlaylists } from "../playlist/listPlaylists";
import type { IpcResult, Playlist } from "./types";
import { toIpcError } from "./utils/toIpcError";

/**
 * Handler for `mp:playlist:list` — a thin request/response adapter over
 * `listPlaylists`.
 */
export const onPlaylistList = async (
  _ev: Electron.IpcMainInvokeEvent,
): Promise<IpcResult<readonly Playlist[]>> => {
  try {
    return { ok: true, value: listPlaylists(getDatabase()) };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  }
};
