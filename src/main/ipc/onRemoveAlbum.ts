import { getDatabase } from "../db/connection";
import { deleteArtworkFiles } from "../library/deleteArtworkFiles";
import { removeAlbumFromLibrary } from "../library/removeAlbumFromLibrary";
import { IpcKeys } from "./ipcKeys";
import type { IpcResult, RemoveAlbumRequest } from "./types";
import { broadcast } from "./utils/broadcast";
import { toIpcError } from "./utils/toIpcError";

/**
 * Channel handler for `mp:library:removeAlbum`.
 *
 * Removes every track of one album (addressed by its identity key) from the
 * library — audio files on disk are never touched. Orphaned artwork rows are
 * GC'd in the same transaction and their files deleted afterwards; a removal
 * that deleted anything broadcasts `mp:library:changed` so views refetch.
 *
 * @param _ev - Electron event object (unused).
 * @param request - Album identity key (`AlbumSummary.albumKey`).
 * @returns `ok` on success.
 */
export const onRemoveAlbum = async (
  _ev: Electron.IpcMainInvokeEvent,
  request: RemoveAlbumRequest,
): Promise<IpcResult<void>> => {
  try {
    const { removed, orphanedFiles } = removeAlbumFromLibrary(
      getDatabase(),
      request.albumKey,
    );
    await deleteArtworkFiles(orphanedFiles);
    if (removed > 0) {
      broadcast(IpcKeys.LibraryChanged, { kind: "removed" });
    }

    return { ok: true, value: undefined };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  }
};
