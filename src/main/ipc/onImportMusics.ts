import { getDatabase } from "../db/connection";
import { runImport } from "../library/importMusics";
import { IpcKeys } from "./ipcKeys";
import type { ImportMusicsRequest, ImportSummary, IpcResult } from "./types";
import { broadcast } from "./utils/broadcast";
import { toIpcError } from "./utils/toIpcError";

/**
 * Single-flight state of the import pipeline. One import runs at a time;
 * `mp:library:cancelImport` flips the flag and the run drains at the next
 * file boundary.
 */
let isImportRunning = false;
let isCancelRequested = false;

/** Test-only reset for the module-level run state. */
export const resetImportStateForTest = (): void => {
  isImportRunning = false;
  isCancelRequested = false;
};

/**
 * Channel handler for `mp:library:import`.
 *
 * Runs the import pipeline (`docs/specs/v1.0/features/library.md`): progress
 * goes out as `mp:library:importProgress` pushes, per-file failures aggregate
 * into the returned `ImportSummary` (the outer result stays `ok`), and a
 * completed run that changed anything broadcasts `mp:library:changed`.
 *
 * @param _ev - Electron event object (unused; pushes are broadcast).
 * @param request - Files / directories to import.
 * @returns The aggregate summary.
 */
export const onImportMusics = async (
  _ev: Electron.IpcMainInvokeEvent,
  request: ImportMusicsRequest,
): Promise<IpcResult<ImportSummary>> => {
  if (isImportRunning) {
    return {
      ok: false,
      error: {
        name: "Error",
        code: "IMPORT_RUNNING",
        message: "An import is already running.",
      },
    };
  }

  isImportRunning = true;
  isCancelRequested = false;
  try {
    const summary = await runImport(getDatabase(), request?.paths ?? [], {
      onProgress: (payload) => broadcast(IpcKeys.ImportProgress, payload),
      isCancelled: () => isCancelRequested,
    });
    if (summary.imported > 0 || summary.updated > 0) {
      broadcast(IpcKeys.LibraryChanged, { kind: "imported" });
    }

    return { ok: true, value: summary };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  } finally {
    isImportRunning = false;
    isCancelRequested = false;
  }
};

/**
 * Channel handler for `mp:library:cancelImport`.
 *
 * Sets the cancellation flag; the running import stops at the next file
 * boundary, keeping everything already committed. A cancel with no running
 * import is a harmless no-op.
 *
 * @param _ev - Electron event object (unused).
 * @returns Always `ok`.
 */
export const onCancelImport = async (
  _ev: Electron.IpcMainInvokeEvent,
): Promise<IpcResult<void>> => {
  if (isImportRunning) {
    isCancelRequested = true;
  }

  return { ok: true, value: undefined };
};
