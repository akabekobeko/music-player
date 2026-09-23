import { getDatabase } from "../../db/connection";
import { cleanupLibraryOrphans } from "../../library/cleanupLibraryOrphans";
import { deleteArtworkFiles } from "../../library/deleteArtworkFiles";
import { runUpdateMusics } from "../../library/runUpdateMusics/runUpdateMusics";
import { IpcKeys } from "../ipcKeys";
import type {
  IpcResult,
  UpdateMusicsRequest,
  UpdateMusicsSummary,
} from "../types";
import { broadcast } from "../utils/broadcast";
import { toIpcError } from "../utils/toIpcError";
import { validateUpdateMusicsRequest } from "./validateUpdateMusicsRequest";

/**
 * Single-flight state: one update runs at a time so two dialogs cannot
 * rewrite the same file concurrently.
 */
let isUpdateRunning = false;

/** Test-only reset for the module-level run state. */
export const resetUpdateStateForTest = (): void => {
  isUpdateRunning = false;
};

/**
 * Channel handler for `mp:library:updateMusics`.
 *
 * Validates the request, runs the write pipeline
 * (`docs/specs/v1.1/architecture/metadata-write.md`) with progress going
 * out as `mp:library:updateProgress` pushes, GCs artwork orphaned by the
 * change, and broadcasts `mp:library:changed` once anything was updated.
 * Per-file failures aggregate into the returned summary; the outer result
 * is `ok: false` only for an invalid request or an id not in the library.
 *
 * @param _ev - Electron event object (unused; pushes are broadcast).
 * @param request - Tracks to update plus the change to apply.
 * @returns The aggregate summary.
 */
export const onUpdateMusics = async (
  _ev: Electron.IpcMainInvokeEvent,
  request: UpdateMusicsRequest,
): Promise<IpcResult<UpdateMusicsSummary>> => {
  const error = validateUpdateMusicsRequest(request);
  if (error !== null) {
    return { ok: false, error };
  }

  if (isUpdateRunning) {
    return {
      ok: false,
      error: {
        name: "Error",
        code: "UPDATE_RUNNING",
        message: "An update is already running.",
      },
    };
  }

  isUpdateRunning = true;
  try {
    const db = getDatabase();
    const summary = await runUpdateMusics(db, request, {
      onProgress: (payload) => broadcast(IpcKeys.UpdateProgress, payload),
    });
    // A renamed artist or replaced cover can strand artist_pictures /
    // pictures rows — GC them and their files once per run.
    const orphanedFiles = cleanupLibraryOrphans(db);
    await deleteArtworkFiles(orphanedFiles);
    if (summary.updated.length > 0) {
      broadcast(IpcKeys.LibraryChanged, { kind: "updated" });
    }

    return { ok: true, value: summary };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  } finally {
    isUpdateRunning = false;
  }
};
