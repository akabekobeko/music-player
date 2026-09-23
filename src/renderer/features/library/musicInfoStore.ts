import type { Music } from "@mp/ipc";

/**
 * Pending state of the music info flow (track row menu → "Song info").
 *
 * The menu that starts the flow unmounts when it closes, so the info dialog
 * cannot live inside it — the menu item stashes the tracks here and the
 * app-level `MusicInfoDialog` (AppLayout) reads them via
 * `useSyncExternalStore`. A single track is a list of one; a multi-track
 * selection (`docs/specs/v1.1/features/multi-edit.md`) is a longer list.
 */

/** The store class: the tracks shown in the info dialog, or `null`. */
export class MusicInfoStore {
  #musics: readonly Music[] | null = null;
  #listeners = new Set<() => void>();

  /** Register a listener. Stable identity (class property). */
  readonly subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  /** Read the tracks on display (`null` = dialog closed). */
  readonly getSnapshot = (): readonly Music[] | null => this.#musics;

  /**
   * Open the info dialog for one or more tracks.
   *
   * @param musics - Tracks to show; an empty list is ignored.
   */
  open(musics: readonly Music[]): void {
    if (musics.length > 0) {
      this.#set(musics);
    }
  }

  /** Close the dialog. */
  close(): void {
    this.#set(null);
  }

  #set(next: readonly Music[] | null): void {
    this.#musics = next;
    for (const listener of [...this.#listeners]) {
      listener();
    }
  }
}

/** The app-wide music info flow store. */
export const musicInfoStore = new MusicInfoStore();
