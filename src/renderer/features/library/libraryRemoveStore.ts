/**
 * Pending state of the artist / album library-removal flow (context or row
 * menu → "Remove from library" → confirmation dialog).
 *
 * The menu that starts the flow unmounts when it closes, so the dialog
 * cannot live inside it — the menu item stashes the target here and the
 * app-level `LibraryRemoveDialog` (AppLayout) reads it via
 * `useSyncExternalStore`.
 */

/** What the confirmation dialog is about to remove. */
export type LibraryRemoveTarget =
  | {
      readonly kind: "artist";
      /**
       * Display-artist name (`album_artist` falling back to `artist`);
       * empty = the unknown-artist bucket.
       */
      readonly artist: string;
    }
  | {
      readonly kind: "album";
      /** Identity key (`AlbumSummary.albumKey` / `AlbumGroup.key`). */
      readonly albumKey: string;
      /** Album display name for the dialog message. */
      readonly album: string;
    };

/** The store class: the removal target under confirmation, or `null`. */
export class LibraryRemoveStore {
  #target: LibraryRemoveTarget | null = null;
  #listeners = new Set<() => void>();

  /** Register a listener. Stable identity (class property). */
  readonly subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  /** Read the pending target (`null` = dialog closed). */
  readonly getSnapshot = (): LibraryRemoveTarget | null => this.#target;

  /**
   * Open the confirmation dialog for a target.
   *
   * @param target - Artist or album about to be removed.
   */
  open(target: LibraryRemoveTarget): void {
    this.#set(target);
  }

  /** Close the dialog. */
  close(): void {
    this.#set(null);
  }

  #set(next: LibraryRemoveTarget | null): void {
    this.#target = next;
    for (const listener of [...this.#listeners]) {
      listener();
    }
  }
}

/** The app-wide artist / album removal flow store. */
export const libraryRemoveStore = new LibraryRemoveStore();
