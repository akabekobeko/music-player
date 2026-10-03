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
 * snapshot, notifies, and forwards every change to the injected saver.
 */
export class PlaylistColumnsStore {
  #snapshot: PlaylistColumnsState = DEFAULT_PLAYLIST_COLUMNS_STATE;
  #listeners = new Set<() => void>();
  #save: (columns: PlaylistColumnsState) => void;

  /**
   * @param save - Persists a change.
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
 * The app-wide Playlist columns store. The layout lives for the session
 * only: nothing is persisted yet, so the saver does nothing.
 */
export const playlistColumnsStore = new PlaylistColumnsStore(() => {});
