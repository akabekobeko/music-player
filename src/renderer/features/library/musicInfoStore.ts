import type { Music } from "@mp/ipc";

/**
 * Pending state of the music info flow (track row menu → "Song info").
 *
 * The menu that starts the flow unmounts when it closes, so the info dialog
 * cannot live inside it — the menu item stashes the track here and the
 * app-level `MusicInfoDialog` (AppLayout) reads it via
 * `useSyncExternalStore`.
 */

/** The store class: the track shown in the info dialog, or `null`. */
export class MusicInfoStore {
  #music: Music | null = null;
  #listeners = new Set<() => void>();

  /** Register a listener. Stable identity (class property). */
  readonly subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  /** Read the track on display (`null` = dialog closed). */
  readonly getSnapshot = (): Music | null => this.#music;

  /**
   * Open the info dialog for a track.
   *
   * @param music - Track to show.
   */
  open(music: Music): void {
    this.#set(music);
  }

  /** Close the dialog. */
  close(): void {
    this.#set(null);
  }

  #set(next: Music | null): void {
    this.#music = next;
    for (const listener of [...this.#listeners]) {
      listener();
    }
  }
}

/** The app-wide music info flow store. */
export const musicInfoStore = new MusicInfoStore();
