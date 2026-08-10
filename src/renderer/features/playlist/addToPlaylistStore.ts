import type { Music } from "@mp/ipc";

/**
 * Pending state of the "Add to playlist ▸ New playlist" flow
 * (`docs/specs/v1.0/features/playlist.md`).
 *
 * The dropdown menu unmounts when it closes, so the name-input dialog cannot
 * live inside it — the menu item stashes the tracks here and the app-level
 * `NewPlaylistDialog` (AppLayout) reads them via `useSyncExternalStore`,
 * creates the playlist, and appends.
 */
export class AddToPlaylistStore {
  /** Tracks waiting for the new playlist's name, or `null` when idle. */
  #pending: readonly Music[] | null = null;
  #listeners = new Set<() => void>();

  /** Register a listener. Stable identity (class property). */
  readonly subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  /** Read the pending tracks (`null` = dialog closed). */
  readonly getSnapshot = (): readonly Music[] | null => this.#pending;

  /**
   * Start the flow: open the name dialog for these tracks.
   *
   * @param musics - Tracks to add once the playlist exists.
   */
  open(musics: readonly Music[]): void {
    this.#set(musics);
  }

  /** Close the dialog (confirm and cancel both end the flow). */
  close(): void {
    this.#set(null);
  }

  #set(next: readonly Music[] | null): void {
    this.#pending = next;
    for (const listener of [...this.#listeners]) {
      listener();
    }
  }
}

/** The app-wide "Add to playlist → New playlist" flow store. */
export const addToPlaylistStore = new AddToPlaylistStore();
