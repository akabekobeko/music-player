import { getDatabase } from "../db/connection";
import { deleteArtworkFiles } from "../library/deleteArtworkFiles";
import { removeArtistFromLibrary } from "../library/removeArtistFromLibrary";
import { IpcKeys } from "./ipcKeys";
import type { IpcResult, RemoveArtistRequest } from "./types";
import { broadcast } from "./utils/broadcast";
import { toIpcError } from "./utils/toIpcError";

/**
 * Channel handler for `mp:library:removeArtist`.
 *
 * Removes every track of one artist from the library — audio files on disk
 * are never touched. Orphaned artwork rows are GC'd in the same transaction
 * and their files deleted afterwards; a removal that deleted anything
 * broadcasts `mp:library:changed` so views refetch.
 *
 * @param _ev - Electron event object (unused).
 * @param request - Artist whose tracks to remove.
 * @returns `ok` on success.
 */
export const onRemoveArtist = async (
  _ev: Electron.IpcMainInvokeEvent,
  request: RemoveArtistRequest,
): Promise<IpcResult<void>> => {
  try {
    const { removed, orphanedFiles } = removeArtistFromLibrary(
      getDatabase(),
      request.artist,
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
