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
      readonly status: "importing";
      readonly files: readonly string[];
      /** Latest `mp:library:importProgress` push, `null` before the first. */
      readonly progress: ImportProgressPayload | null;
      /** Whether the user already pressed Cancel (button then disables). */
      readonly cancelRequested: boolean;
    }
  | {
      readonly status: "done";
      readonly summary: ImportSummary;
      /** Whether the run ended via cancellation. */
      readonly cancelled: boolean;
    }
  | { readonly status: "error"; readonly error: IpcError };

/** The slice of `window.mp` the store needs (injectable for tests). */
export type ImportBridge = {
  readonly openImportTargets: () => Promise<IpcResult<OpenImportTargetsOk>>;
  readonly expandPaths: (
    paths: readonly string[],
  ) => Promise<IpcResult<ExpandPathsOk>>;
  readonly importMusics: (
    request: ImportMusicsRequest,
  ) => Promise<IpcResult<ImportSummary>>;
  readonly cancelImport: () => Promise<IpcResult<void>>;
};
