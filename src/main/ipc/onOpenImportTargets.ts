import { dialog } from "electron";
import { getSettings, updateSettings } from "../settings/settingsManager";
import { buildImportTargetsDialogOptions } from "./buildImportTargetsDialogOptions";
import { resolveExistingPath } from "./resolveExistingPath";
import type { IpcResult, OpenImportTargetsOk } from "./types";
import { toIpcError } from "./utils/toIpcError";

/**
 * Channel handler for `mp:dialog:openImportTargets`.
 *
 * Shows the system open dialog at the previously picked path
 * (`AppSettings.importDialogPath`, climbed to the nearest existing ancestor
 * when stale) and persists the new pick for the next launch. Cancellation is
 * not an error: it resolves `ok` with an empty `paths` array, which the
 * Renderer treats as "nothing to do".
 *
 * @param _ev - Electron event object (unused).
 * @returns The selected file / directory paths.
 */
export const onOpenImportTargets = async (
  _ev: Electron.IpcMainInvokeEvent,
): Promise<IpcResult<OpenImportTargetsOk>> => {
  try {
    const saved = getSettings().importDialogPath;
    const result = await dialog.showOpenDialog(
      buildImportTargetsDialogOptions(
        saved !== undefined ? resolveExistingPath(saved) : null,
      ),
    );
    const paths = result.canceled ? [] : result.filePaths;
    const [first] = paths;
    if (first !== undefined) {
      updateSettings({ importDialogPath: first });
    }

    return { ok: true, value: { paths } };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  }
};
