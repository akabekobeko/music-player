import type {
  ExpandPathsOk,
  ImportMusicsRequest,
  ImportProgressPayload,
  ImportSummary,
  IpcError,
  IpcResult,
  OpenImportTargetsOk,
} from "@mp/ipc";

/**
 * State machine behind the import entrance
 * (`docs/specs/v1.0/features/library.md`): both entrances — the picker
 * dialog and window-wide drag & drop — funnel their paths through Main's
 * expansion into one confirmation dialog, and `mp:library:import` only runs
 * after the user confirms.
 */

/** UI-facing state of the import entrance. */
export type ImportEntryState =
  | { readonly status: "idle" }
  | { readonly status: "expanding" }
  | { readonly status: "confirming"; readonly files: readonly string[] }
  | {
      /** Discriminant: `mp:library:import` is running. */
      readonly status: "importing";
      /** The confirmed file list handed to `mp:library:import`. */
      readonly files: readonly string[];
      /** Latest `mp:library:importProgress` push, `null` before the first. */
      readonly progress: ImportProgressPayload | null;
      /** Whether the user already pressed Cancel (button then disables). */
      readonly cancelRequested: boolean;
    }
  | {
      /** Discriminant: the run finished (completed or cancelled). */
      readonly status: "done";
      /** Final report returned by `mp:library:import`. */
      readonly summary: ImportSummary;
      /** Whether the run ended via cancellation. */
      readonly cancelled: boolean;
    }
  | { readonly status: "error"; readonly error: IpcError };

/** The slice of `window.mp` the store needs (injectable for tests). */
export type ImportBridge = {
  /** `mp:dialog:openImportTargets`: the file / folder picker. */
  readonly openImportTargets: () => Promise<IpcResult<OpenImportTargetsOk>>;
  /** `mp:dnd:expandPaths`: recurse directories, keep audio files only. */
  readonly expandPaths: (
    paths: readonly string[],
  ) => Promise<IpcResult<ExpandPathsOk>>;
  /** `mp:library:import`: run the import over the confirmed files. */
  readonly importMusics: (
    request: ImportMusicsRequest,
  ) => Promise<IpcResult<ImportSummary>>;
  /** `mp:library:cancelImport`: ask the running import to stop. */
  readonly cancelImport: () => Promise<IpcResult<void>>;
};
