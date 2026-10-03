import type { AppSettings } from "@mp/ipc";
import { DEFAULT_PLAYLIST_COLUMNS_STATE } from "./constants";
import {
  type PlaylistColumnsAction,
  reducePlaylistColumns,
} from "./reducePlaylistColumns";
import type { PlaylistColumnsState } from "./types";

/**
 * Visible columns and column widths of the Playlist table
 * (`docs/specs/v1.3/architecture/column-settings.md`).
 *
 * React-free store consumed via `useSyncExternalStore`, shared by the
 * content toolbar's columns menu (controls) and the Playlist view (the
 * table), which live in different component trees. The state transitions
 * are the pure `reducePlaylistColumns`; the store only holds the immutable
 * snapshot, notifies, and forwards every change to the injected saver, which
 * pushes it to `AppSettings.playlistColumns` (Main debounces the disk
 * write). The bootstrap seeds the store from the same field, so the layout
 * survives a restart.
 */
export class PlaylistColumnsStore {
  #snapshot: PlaylistColumnsState = DEFAULT_PLAYLIST_COLUMNS_STATE;
  #listeners = new Set<() => void>();
  #save: (columns: PlaylistColumnsState) => void;

  /**
   * @param save - Persists a change (production: `mp:settings:set`).
   */
  constructor(save: (columns: PlaylistColumnsState) => void) {
    this.#save = save;
  }

  /** Register a snapshot listener. Stable identity (class property). */
  readonly subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  /** Read the current snapshot. Pure; stable until the next change. */
  readonly getSnapshot = (): PlaylistColumnsState => this.#snapshot;

  /**
   * Seed the store from the persisted settings. Called once in the bootstrap
   * before the first render; no save-back. Unknown column ids and widths
   * below the minimum are kept as saved: the layout is resolved against the
   * column definitions at render time.
   *
   * @param playlistColumns - `AppSettings.playlistColumns` (or `undefined`
   *   when unset, which keeps the default layout).
   */
  initialize(playlistColumns: AppSettings["playlistColumns"]): void {
    if (playlistColumns === undefined) {
      return;
    }

    this.#snapshot = {
      visibleIds: playlistColumns.visibleIds,
      widths: playlistColumns.widths,
    };
  }

  /**
   * Apply a column action and persist the result. An action that changes
   * nothing is neither saved nor notified.
   *
   * @param action - The column change.
   */
  dispatch(action: PlaylistColumnsAction): void {
    const next = reducePlaylistColumns(this.#snapshot, action);
    if (next === this.#snapshot) {
      return;
    }

    this.#snapshot = next;
    this.#save(next);
    for (const listener of [...this.#listeners]) {
      listener();
    }
  }
}

/**
 * The app-wide Playlist columns store, wired to the settings channel. The
 * saver always sends the whole layout; Main replaces the saved one with it.
 */
export const playlistColumnsStore = new PlaylistColumnsStore(
  (playlistColumns) => {
    void window.mp.settings.set({ patch: { playlistColumns } });
  },
);
