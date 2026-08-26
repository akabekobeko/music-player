/**
 * Pending state of the artist edit flow (context / row menu → "Artist
 * Info").
 *
 * The menu that starts the flow unmounts when it closes, so the edit dialog
 * cannot live inside it — the menu item stashes the artist here and the
 * app-level `ArtistEditDialog` (AppLayout) reads it via
 * `useSyncExternalStore`.
 */

/** Artist under edit: the dialog's subject. */
export type ArtistEditTarget = {
  readonly name: string;
  /** Current picture path, or `null` when the artist has none. */
  readonly picturePath: string | null;
  /** Number of songs credited to the artist, shown as dialog metadata. */
  readonly musicCount: number;
  /**
   * Stored initial (capital letter A–Z), or `null` when the artist list
   * classifies the artist automatically.
   */
  readonly initial: string | null;
};

/** The store class: the artist waiting in the edit dialog, or `null`. */
export class ArtistEditStore {
  #target: ArtistEditTarget | null = null;
  #listeners = new Set<() => void>();

  /** Register a listener. Stable identity (class property). */
  readonly subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  /** Read the artist under edit (`null` = dialog closed). */
  readonly getSnapshot = (): ArtistEditTarget | null => this.#target;

  /**
   * Open the edit dialog for an artist.
   *
   * @param target - Artist to edit.
   */
  open(target: ArtistEditTarget): void {
    this.#set(target);
  }

  /** Close the dialog (apply and cancel both end the flow). */
  close(): void {
    this.#set(null);
  }

  #set(next: ArtistEditTarget | null): void {
    this.#target = next;
    for (const listener of [...this.#listeners]) {
      listener();
    }
  }
}

/** The app-wide artist edit flow store. */
export const artistEditStore = new ArtistEditStore();
