import { AUDIO_FILE_EXTENSIONS } from "../library/AUDIO_FILE_EXTENSIONS";

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
