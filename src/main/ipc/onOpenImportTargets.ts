import { dialog } from "electron";
import { AUDIO_FILE_EXTENSIONS } from "../library/audioExtensions";
import type { IpcResult, OpenImportTargetsOk } from "./types";
import { toIpcError } from "./utils/toIpcError";

/**
 * Options for the import target picker
 * (`docs/specs/v1.0/features/library.md`): files and directories, multiple
 * selection, filtered to the importable audio extensions.
 *
 * Exported as a pure builder so the dialog contract is unit-testable without
 * mocking `dialog` (`docs/specs/v1.0/architecture/tech-stack.md`).
 *
 * @returns Options for `dialog.showOpenDialog`.
 */
export const buildImportTargetsDialogOptions =
  (): Electron.OpenDialogOptions => ({
    properties: ["openFile", "openDirectory", "multiSelections"],
    filters: [{ name: "Audio Files", extensions: [...AUDIO_FILE_EXTENSIONS] }],
  });

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
