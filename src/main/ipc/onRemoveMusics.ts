import { getDatabase } from "../db/connection";
import { deleteArtworkFiles } from "../library/deleteArtworkFiles";
import { removeMusicsFromLibrary } from "../library/removeMusicsFromLibrary";
import { IpcKeys } from "./ipcKeys";
import type { IpcResult, RemoveMusicsRequest } from "./types";
import { broadcast } from "./utils/broadcast";
import { toIpcError } from "./utils/toIpcError";

/**
 * Channel handler for `mp:library:removeMusics`.
 *
 * Removes tracks from the library — audio files on disk are never touched.
 * Orphaned artwork rows are GC'd in the same transaction and their files
 * deleted afterwards; a completed removal broadcasts `mp:library:changed`
 * so views refetch.
 *
 * @param _ev - Electron event object (unused).
 * @param request - Ids of the tracks to remove.
 * @returns `ok` on success.
 */
export const onRemoveMusics = async (
  _ev: Electron.IpcMainInvokeEvent,
  request: RemoveMusicsRequest,
): Promise<IpcResult<void>> => {
  try {
    const musicIds = request?.musicIds ?? [];
    const orphanedFiles = removeMusicsFromLibrary(getDatabase(), musicIds);
    await deleteArtworkFiles(orphanedFiles);
    if (musicIds.length > 0) {
      broadcast(IpcKeys.LibraryChanged, { kind: "removed" });
    }

    return { ok: true, value: undefined };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  }
};
