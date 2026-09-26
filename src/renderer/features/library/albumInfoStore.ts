import type { AlbumSummary } from "@mp/ipc";
import { DialogNavigator } from "./dialogNavigation";

/**
 * Pending state of the album info flow (album menu → "Album Info").
 *
 * The menu that starts the flow unmounts when it closes, so the info dialog
 * cannot live inside it — the menu item stashes the album here and the
 * app-level `AlbumInfoDialog` (AppLayout) reads it via
 * `useSyncExternalStore`. An album opened from a list also remembers that
 * list, so the dialog's header arrows can step to the neighbouring albums
 * (`docs/specs/v1.1/features/music-info-dialog.md`, previous / next
 * navigation).
 */

/**
 * Album shown in the info dialog: the fields common to the Artist view's
 * `AlbumGroup` and the Album view's `AlbumSummary`, so either source can
 * open the dialog as-is.
 */
export type AlbumInfoTarget = {
  /**
   * Identity within the list the album was opened from (the Artist view's
   * `AlbumGroup.key`, the Album view's `AlbumSummary.albumKey`).
   */
  readonly key: string;
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

/**
 * The Album view's summary as a dialog target: its `albumKey` is the
 * identity.
 *
 * @param album - The summary to show.
 * @returns The target.
 */
export const albumInfoTargetOf = (album: AlbumSummary): AlbumInfoTarget => ({
  ...album,
  key: album.albumKey,
});

/** What the dialog shows: the album and its neighbours in its list. */
export type AlbumInfoState = {
  /** Album on display. */
  readonly album: AlbumInfoTarget;
  /** Album the header's "previous" arrow moves to, `null` when there is none. */
  readonly previous: AlbumInfoTarget | null;
  /** Album the header's "next" arrow moves to, `null` when there is none. */
  readonly next: AlbumInfoTarget | null;
};

/** The store class: the album shown in the info dialog, or `null`. */
export class AlbumInfoStore {
  #state: AlbumInfoState | null = null;
  #navigator = new DialogNavigator<AlbumInfoTarget>();
  #listeners = new Set<() => void>();

  /** Register a listener. Stable identity (class property). */
  readonly subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  /** Read the album on display (`null` = dialog closed). */
  readonly getSnapshot = (): AlbumInfoState | null => this.#state;

  /**
   * Open the info dialog for an album.
   *
   * @param album - Album to show.
   * @param siblings - The list the album was opened from, in display order.
   * The header arrows step through it (matched by `key`); omitted, they
   * are disabled.
   */
  open(album: AlbumInfoTarget, siblings?: readonly AlbumInfoTarget[]): void {
    this.#navigator.locate(siblings, (entry) => entry.key === album.key);
    this.#set(album);
  }

  /** Show the previous album of the list; ignored when there is none. */
  previous(): void {
    this.#move(-1);
  }

  /** Show the next album of the list; ignored when there is none. */
  next(): void {
    this.#move(1);
  }

  /** Close the dialog. */
  close(): void {
    this.#navigator.reset();
    this.#set(null);
  }

  #move(step: -1 | 1): void {
    const album = this.#navigator.move(step);
    if (album !== null) {
      this.#set(album);
    }
  }

  #set(album: AlbumInfoTarget | null): void {
    this.#state =
      album === null ? null : { album, ...this.#navigator.adjacent() };
    for (const listener of [...this.#listeners]) {
      listener();
    }
  }
}

/** The app-wide album info flow store. */
export const albumInfoStore = new AlbumInfoStore();
