/**
 * Pending state of the album info flow (album menu → "Album Info").
 *
 * The menu that starts the flow unmounts when it closes, so the info dialog
 * cannot live inside it — the menu item stashes the album here and the
 * app-level `AlbumInfoDialog` (AppLayout) reads it via
 * `useSyncExternalStore`.
 */

/**
 * Album shown in the info dialog: the fields common to the Artist view's
 * `AlbumGroup` and the Album view's `AlbumSummary`, so either source can
 * open the dialog as-is.
 */
export type AlbumInfoTarget = {
  /** Album title as tagged; empty when the tracks carry no album tag. */
  readonly album: string;
  /** Display artist (albumArtist, falling back to artist). */
  readonly artist: string;
  /** Representative year (smallest non-null), or `null` when none. */
  readonly year: number | null;
  /** Representative genre; empty when every track is untagged. */
  readonly genre: string;
  /**
   * Number of tracks as the source view counted them (the Album view's
   * count follows its active filter).
   */
  readonly musicCount: number;
  /** Sum of the tracks' `durationMs` in milliseconds. */
  readonly totalDurationMs: number;
  /** Absolute path of the representative artwork, or `null` when none. */
  readonly picturePath: string | null;
};

/** The store class: the album shown in the info dialog, or `null`. */
export class AlbumInfoStore {
  #album: AlbumInfoTarget | null = null;
  #listeners = new Set<() => void>();

  /** Register a listener. Stable identity (class property). */
  readonly subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  /** Read the album on display (`null` = dialog closed). */
  readonly getSnapshot = (): AlbumInfoTarget | null => this.#album;

  /**
   * Open the info dialog for an album.
   *
   * @param album - Album to show.
   */
  open(album: AlbumInfoTarget): void {
    this.#set(album);
  }

  /** Close the dialog. */
  close(): void {
    this.#set(null);
  }

  #set(next: AlbumInfoTarget | null): void {
    this.#album = next;
    for (const listener of [...this.#listeners]) {
      listener();
    }
  }
}

/** The app-wide album info flow store. */
export const albumInfoStore = new AlbumInfoStore();
