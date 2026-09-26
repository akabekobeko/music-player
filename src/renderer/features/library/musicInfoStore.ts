import type { Music, UpdatedMusic } from "@mp/ipc";
import { DialogNavigator } from "./dialogNavigation";
import { uniqueMusics } from "./selection/uniqueMusics";

/**
 * Pending state of the music info flow (track row menu → "Song info").
 *
 * The menu that starts the flow unmounts when it closes, so the info dialog
 * cannot live inside it — the menu item stashes the tracks here and the
 * app-level `MusicInfoDialog` (AppLayout) reads them via
 * `useSyncExternalStore`. A single track is a list of one; a multi-track
 * selection (`docs/specs/v1.1/features/multi-edit.md`) is a longer list.
 * A single track opened from a list also remembers that list, so the
 * dialog's header arrows can step to the neighbouring tracks
 * (`docs/specs/v1.1/features/music-info-dialog.md`, previous / next
 * navigation).
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

/** What the dialog shows: the tracks and, for a single one, its neighbours. */
export type MusicInfoState = {
  /** Tracks on display; never empty. */
  readonly musics: readonly Music[];
  /** Track the header's "previous" arrow moves to, `null` when there is none. */
  readonly previous: Music | null;
  /** Track the header's "next" arrow moves to, `null` when there is none. */
  readonly next: Music | null;
};

/** The store class: the tracks shown in the info dialog, or `null`. */
export class MusicInfoStore {
  #state: MusicInfoState | null = null;
  #navigator = new DialogNavigator<Music>();
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
  readonly getSnapshot = (): MusicInfoState | null => this.#state;

  /**
   * Open the info dialog for one or more tracks.
   *
   * @param musics - Tracks to show; an empty list is ignored.
   * @param siblings - The list a single track was opened from, in display
   * order (a playlist may list a track twice; each track counts once). The
   * header arrows step through it; omitted, or with several tracks, they
   * are disabled.
   */
  open(musics: readonly Music[], siblings?: readonly Music[]): void {
    if (musics.length === 0) {
      return;
    }

    const single = musics.length === 1 ? musics[0] : undefined;
    if (single === undefined) {
      this.#navigator.reset();
    } else {
      this.#navigator.locate(
        siblings === undefined ? undefined : uniqueMusics(siblings),
        (music) => music.id === single.id,
      );
    }

    this.#set(musics);
  }

  /** Show the previous track of the list; ignored when there is none. */
  previous(): void {
    this.#move(-1);
  }

  /** Show the next track of the list; ignored when there is none. */
  next(): void {
    this.#move(1);
  }

  /** Close the dialog. */
  close(): void {
    this.#navigator.reset();
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

  #move(step: -1 | 1): void {
    const music = this.#navigator.move(step);
    if (music !== null) {
      this.#set([music]);
    }
  }

  #set(musics: readonly Music[] | null): void {
    this.#state =
      musics === null ? null : { musics, ...this.#navigator.adjacent() };
    for (const listener of [...this.#listeners]) {
      listener();
    }
  }
}

/** The app-wide music info flow store. */
export const musicInfoStore = new MusicInfoStore();
