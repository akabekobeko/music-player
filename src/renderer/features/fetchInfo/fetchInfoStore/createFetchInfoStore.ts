import type { FetchProgressPayload, Music } from "@mp/ipc";
import { toBridgeError } from "@/features/import/importStore/toBridgeError";
import type { FetchCounts, FetchInfoBridge, FetchInfoState } from "./types";

/**
 * React-free store consumed via `useSyncExternalStore`; the IPC surface
 * and the "applied" hand-off are injected so tests never touch `window.mp`
 * (`docs/specs/v1.2/features/fetch-dialog.md`).
 */

const IDLE: FetchInfoState = { status: "idle" };

const ZERO_COUNTS: FetchCounts = {
  updated: 0,
  unchanged: 0,
  notFound: 0,
  failed: 0,
};

/**
 * Build a fetch-entrance store.
 *
 * @param bridge - IPC surface plus the applied hand-off.
 * @returns Store with subscribe / getSnapshot plus the entrance commands.
 */
export const createFetchInfoStore = (bridge: FetchInfoBridge) => {
  let state: FetchInfoState = IDLE;
  const listeners = new Set<() => void>();

  const setState = (next: FetchInfoState): void => {
    state = next;
    for (const listener of [...listeners]) {
      listener();
    }
  };

  return {
    subscribe: (listener: () => void): (() => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: (): FetchInfoState => state,

    /**
     * Open the confirmation for the given tracks. Ignored while a run is in
     * progress (the menu entries are disabled then) and for an empty list.
     *
     * @param musics - Tracks the menu entry was invoked for.
     */
    open: (musics: readonly Music[]): void => {
      if (state.status === "running" || musics.length === 0) {
        return;
      }

      setState({ status: "confirming", musics });
    },

    /**
     * Run `mp:musicbrainz:fetchMusicInfo` with the confirmed tracks. The
     * caller stops playback first when the current track is among them.
     */
    start: async (): Promise<void> => {
      if (state.status !== "confirming") {
        return;
      }

      const musics = state.musics;
      setState({
        status: "running",
        musics,
        progress: null,
        counts: ZERO_COUNTS,
        cancelRequested: false,
      });
      try {
        const result = await bridge.fetchMusicInfo({
          musicIds: musics.map((music) => music.id),
        });
        if (!result.ok) {
          setState({ status: "error", error: result.error });
          return;
        }

        if (result.value.updated.length > 0) {
          bridge.applied({ targets: musics, updated: result.value.updated });
        }

        setState({ status: "done", musics, summary: result.value });
      } catch (reason) {
        setState({ status: "error", error: toBridgeError(reason) });
      }
    },

    /**
     * Apply a `mp:musicbrainz:fetchProgress` push. Registered app-lifetime
     * in the bootstrap; pushes outside a run are ignored.
     */
    handleProgress: (payload: FetchProgressPayload): void => {
      if (state.status === "running") {
        setState({
          ...state,
          progress: payload,
          counts: {
            ...state.counts,
            [payload.result]: state.counts[payload.result] + 1,
          },
        });
      }
    },

    /** Request cancellation of the running fetch (button disables). */
    cancelFetch: async (): Promise<void> => {
      if (state.status !== "running" || state.cancelRequested) {
        return;
      }

      setState({ ...state, cancelRequested: true });
      try {
        const result = await bridge.cancelFetch();
        if (!result.ok) {
          console.error("Failed to cancel fetch", result.error);
        }
      } catch (reason) {
        console.error("Failed to cancel fetch", reason);
      }
    },

    /** Close the dialog. Ignored while a fetch is running. */
    close: (): void => {
      if (state.status === "running") {
        return;
      }

      setState(IDLE);
    },
  };
};

/** Store type as used by components. */
export type FetchInfoStore = ReturnType<typeof createFetchInfoStore>;
