import { dialog } from "electron";
import { buildImportTargetsDialogOptions } from "./buildImportTargetsDialogOptions";
import type { IpcResult, OpenImportTargetsOk } from "./types";
import { toIpcError } from "./utils/toIpcError";

/**
 * Channel handler for `mp:dialog:openImportTargets`.
 *
 * Shows the system open dialog. Cancellation is not an error: it resolves
 * `ok` with an empty `paths` array, which the Renderer treats as "nothing to
 * do".
 *
 * @param _ev - Electron event object (unused).
 * @returns The selected file / directory paths.
 */
export const onOpenImportTargets = async (
  _ev: Electron.IpcMainInvokeEvent,
): Promise<IpcResult<OpenImportTargetsOk>> => {
  try {
    const result = await dialog.showOpenDialog(
      buildImportTargetsDialogOptions(),
    );
    return {
      ok: true,
      value: { paths: result.canceled ? [] : result.filePaths },
    };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  }
};
