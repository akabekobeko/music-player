import { getDatabase } from "../db/connection";
import { getAlbums } from "../library/getAlbums";
import type { AlbumFilter, AlbumSummary, IpcResult } from "./types";
import { toIpcError } from "./utils/toIpcError";

/**
 * Channel handler for `mp:library:getAlbums`.
 *
 * @param _ev - Electron event object (unused).
 * @param filter - Filter condition converted to a WHERE clause.
 * @returns Album summaries matching the filter.
 */
export const onGetAlbums = async (
  _ev: Electron.IpcMainInvokeEvent,
  filter: AlbumFilter,
): Promise<IpcResult<readonly AlbumSummary[]>> => {
  try {
    return { ok: true, value: getAlbums(getDatabase(), filter) };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  }
};
