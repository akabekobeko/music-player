import { AUDIO_FILE_EXTENSIONS } from "../library/AUDIO_FILE_EXTENSIONS";

/**
 * Options for the import target picker
 * (`docs/specs/v1.0/features/library.md`): files and directories, multiple
 * selection, filtered to the importable audio extensions. The last pick is
 * restored via `defaultPath` — an app-own history in `settings.json`, so it
 * never touches the OS-shared "recent places" state of other apps.
 *
 * Exported as a pure builder so the dialog contract is unit-testable without
 * mocking `dialog` (`docs/specs/v1.0/architecture/tech-stack.md`).
 *
 * @param defaultPath - Existing path to open the dialog at, or `null` to
 *   let the OS decide (first launch, or nothing on the chain exists).
 * @returns Options for `dialog.showOpenDialog`.
 */
export const buildImportTargetsDialogOptions = (
  defaultPath: string | null,
): Electron.OpenDialogOptions => ({
  properties: ["openFile", "openDirectory", "multiSelections"],
  filters: [{ name: "Audio Files", extensions: [...AUDIO_FILE_EXTENSIONS] }],
  ...(defaultPath !== null ? { defaultPath } : {}),
});
