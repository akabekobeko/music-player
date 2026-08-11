import type { ImportProgressPayload } from "@mp/ipc";
import { toBridgeError } from "./toBridgeError";
import type { ImportBridge, ImportEntryState } from "./types";

/**
 * React-free store consumed via `useSyncExternalStore`; the IPC surface is
 * injected so tests never touch `window.mp`
 * (`docs/specs/v1.0/features/library.md`).
 */

const IDLE: ImportEntryState = { status: "idle" };

/**
 * Build an import-entrance store.
 *
 * @param bridge - IPC surface (production: `window.mp` wrappers).
 * @returns Store with subscribe / getSnapshot plus the entrance commands.
 */
export const createImportStore = (bridge: ImportBridge) => {
  let state: ImportEntryState = IDLE;
  const listeners = new Set<() => void>();

  const setState = (next: ImportEntryState): void => {
    state = next;
    for (const listener of [...listeners]) {
      listener();
    }
  };

  /** Files already listed when another batch arrives (merge target). */
  const currentFiles = (): readonly string[] =>
    state.status === "confirming" ? state.files : [];

  /** Whether a bridge call is in flight (commands are ignored meanwhile). */
  const isBusy = (): boolean =>
    state.status === "expanding" || state.status === "importing";

  /**
   * Whether the running import has a pending cancel request. A function
   * (not an inline check) because `state` is reassigned by the progress /
   * cancel handlers while `startImport` awaits — an inline check would keep
   * TS's stale narrowing from the guard at the top of `startImport`.
   */
  const isCancelRequested = (): boolean =>
    state.status === "importing" && state.cancelRequested;

  const expandInto = async (paths: readonly string[]): Promise<void> => {
    const known = currentFiles();
    setState({ status: "expanding" });
    try {
      const result = await bridge.expandPaths(paths);
      if (!result.ok) {
        setState({ status: "error", error: result.error });
        return;
      }

      const merged = [...new Set([...known, ...result.value.files])].sort();
      setState({ status: "confirming", files: merged });
    } catch (reason) {
      setState({ status: "error", error: toBridgeError(reason) });
    }
  };

  return {
    subscribe: (listener: () => void): (() => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: (): ImportEntryState => state,

    /**
     * Entrance 1: the file / folder picker. A cancelled dialog leaves the
     * current state untouched.
     */
    openFromDialog: async (): Promise<void> => {
      if (isBusy()) {
        return;
      }

      try {
        const picked = await bridge.openImportTargets();
        if (!picked.ok) {
          setState({ status: "error", error: picked.error });
          return;
        }

        if (picked.value.paths.length === 0) {
          return;
        }

        await expandInto(picked.value.paths);
      } catch (reason) {
        setState({ status: "error", error: toBridgeError(reason) });
      }
    },

    /**
     * Entrance 2: window-wide drag & drop. New batches merge into an open
     * confirmation list (de-duplicated, sorted).
     *
     * @param paths - Absolute paths resolved via `mp.dnd.pathFor`.
     */
    addPaths: async (paths: readonly string[]): Promise<void> => {
      if (isBusy() || paths.length === 0) {
        return;
      }

      await expandInto(paths);
    },

    /** Run `mp:library:import` with the confirmed file list. */
    startImport: async (): Promise<void> => {
      if (state.status !== "confirming" || state.files.length === 0) {
        return;
      }

      const files = state.files;
      setState({
        status: "importing",
        files,
        progress: null,
        cancelRequested: false,
      });
      try {
        const result = await bridge.importMusics({ paths: files });
        if (!result.ok) {
          setState({ status: "error", error: result.error });
          return;
        }

        setState({
          status: "done",
          summary: result.value,
          cancelled: isCancelRequested(),
        });
      } catch (reason) {
        setState({ status: "error", error: toBridgeError(reason) });
      }
    },

    /**
     * Apply an `mp:library:importProgress` push. Registered app-lifetime in
     * the bootstrap; pushes outside a run (e.g. an import started by another
     * window) are ignored.
     */
    handleProgress: (payload: ImportProgressPayload): void => {
      if (state.status === "importing") {
        setState({ ...state, progress: payload });
      }
    },

    /** Request cancellation of the running import (button disables). */
    cancelImport: async (): Promise<void> => {
      if (state.status !== "importing" || state.cancelRequested) {
        return;
      }

      setState({ ...state, cancelRequested: true });
      try {
        const result = await bridge.cancelImport();
        if (!result.ok) {
          console.error("Failed to cancel import", result.error);
        }
      } catch (reason) {
        console.error("Failed to cancel import", reason);
      }
    },

    /** Close the dialog. Ignored while an import is running. */
    cancel: (): void => {
      if (state.status === "importing") {
        return;
      }

      setState(IDLE);
    },
  };
};

/** Store type as used by components. */
export type ImportStore = ReturnType<typeof createImportStore>;
