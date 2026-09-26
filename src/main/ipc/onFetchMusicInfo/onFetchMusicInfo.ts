import { getDatabase } from "../../db/connection";
import { cleanupLibraryOrphans } from "../../library/cleanupLibraryOrphans";
import { deleteArtworkFiles } from "../../library/deleteArtworkFiles";
import { runFetchMusicInfo } from "../../musicbrainz/runFetchMusicInfo/runFetchMusicInfo";
import { IpcKeys } from "../ipcKeys";
import type {
  FetchMusicInfoRequest,
  FetchMusicInfoSummary,
  IpcResult,
} from "../types";
import { broadcast } from "../utils/broadcast";
import { toIpcError } from "../utils/toIpcError";
import { validateFetchMusicInfoRequest } from "./validateFetchMusicInfoRequest";

/**
 * Single-flight state of the bulk fetch. One run at a time
 * (`docs/specs/v1.2/architecture/fetch-run.md`); the controller is what
 * `mp:musicbrainz:cancelFetch` aborts. Shared, mutable module state, which
 * is why the two handlers live in one file.
 */
let running: AbortController | null = null;

/** Test-only reset for the module-level run state. */
export const resetFetchStateForTest = (): void => {
  running = null;
};

/**
 * Channel handler for `mp:musicbrainz:fetchMusicInfo`.
 *
 * Validates the request, runs the bulk fetch with progress going out as
 * `mp:musicbrainz:fetchProgress` pushes, GCs artwork orphaned by the
 * writes, and broadcasts `mp:library:changed` once anything was updated.
 * Per-track failures aggregate into the summary; the outer result is
 * `ok: false` only for an invalid request or a run already in progress
 * (`MB_BUSY`).
 *
 * @param _ev - Electron event object (unused; pushes are broadcast).
 * @param request - Tracks to complete.
 * @returns The aggregate summary.
 */
export const onFetchMusicInfo = async (
  _ev: Electron.IpcMainInvokeEvent,
  request: FetchMusicInfoRequest,
): Promise<IpcResult<FetchMusicInfoSummary>> => {
  const error = validateFetchMusicInfoRequest(request);
  if (error !== null) {
    return { ok: false, error };
  }

  if (running !== null) {
    return {
      ok: false,
      error: {
        name: "Error",
        code: "MB_BUSY",
        message: "A fetch is already running.",
      },
    };
  }

  const controller = new AbortController();
  running = controller;
  try {
    const db = getDatabase();
    const summary = await runFetchMusicInfo(db, request, {
      onProgress: (payload) => broadcast(IpcKeys.FetchProgress, payload),
      signal: controller.signal,
    });
    // A completed artist tag or replaced cover can strand artist_pictures /
    // pictures rows; GC them and their files once per run.
    const orphanedFiles = cleanupLibraryOrphans(db);
    await deleteArtworkFiles(orphanedFiles);
    if (summary.updated.length > 0) {
      broadcast(IpcKeys.LibraryChanged, { kind: "updated" });
    }

    return { ok: true, value: summary };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  } finally {
    running = null;
  }
};

/**
 * Channel handler for `mp:musicbrainz:cancelFetch`.
 *
 * Aborts the running fetch: the client cuts its current request short and
 * the run stops at the next group or track boundary, keeping every write
 * already made. A cancel with no running fetch is a harmless no-op.
 *
 * @param _ev - Electron event object (unused).
 * @returns Always `ok`.
 */
export const onCancelFetch = async (
  _ev: Electron.IpcMainInvokeEvent,
): Promise<IpcResult<void>> => {
  running?.abort();
  return { ok: true, value: undefined };
};
