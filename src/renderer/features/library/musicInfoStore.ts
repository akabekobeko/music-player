import type { Music, UpdatedMusic } from "@mp/ipc";

/**
 * Pending state of the music info flow (track row menu → "Song info").
 *
 * The menu that starts the flow unmounts when it closes, so the info dialog
 * cannot live inside it — the menu item stashes the tracks here and the
 * app-level `MusicInfoDialog` (AppLayout) reads them via
 * `useSyncExternalStore`. A single track is a list of one; a multi-track
 * selection (`docs/specs/v1.1/features/multi-edit.md`) is a longer list.
 *
 * The store also carries the "applied" notification: the dialog reports
 * what an apply updated, and the views that must follow a changed artist
 * or album (`docs/specs/v1.1/features/route-follow.md`) listen here, so the
 * dialog never knows about routes.
 */

/** What one apply wrote: the tracks as opened and the ones re-read after. */
export type AppliedUpdate = {
  /** The dialog's tracks before the write (their former artist / album). */
  readonly targets: readonly Music[];
  /** The tracks that were written, as re-read from their files. */
  readonly updated: readonly UpdatedMusic[];
};

/** The store class: the tracks shown in the info dialog, or `null`. */
export class MusicInfoStore {
  #musics: readonly Music[] | null = null;
  #listeners = new Set<() => void>();
  #appliedListeners = new Set<(update: AppliedUpdate) => void>();

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

  /**
   * Listen for applies that updated at least one track.
   *
   * @param listener - Receives the applied update.
   * @returns Unsubscribe.
   */
  readonly onApplied = (
    listener: (update: AppliedUpdate) => void,
  ): (() => void) => {
    this.#appliedListeners.add(listener);
    return () => {
      this.#appliedListeners.delete(listener);
    };
  };

  /**
   * Report an apply's result to the `onApplied` listeners.
   *
   * @param update - The applied update; ignored when nothing was updated.
   */
  notifyApplied(update: AppliedUpdate): void {
    if (update.updated.length === 0) {
      return;
    }

    for (const listener of [...this.#appliedListeners]) {
      listener(update);
    }
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
