import type { AlbumFilter } from "@mp/ipc";
import {
  type AlbumFilterAction,
  reduceAlbumFilter,
} from "./reduceAlbumFilter/reduceAlbumFilter";

/**
 * Filter state of the Album view (`docs/specs/v1.0/features/album-view.md`).
 *
 * React-free store consumed via `useSyncExternalStore`, shared by the
 * sidebar's filter panel (controls) and the albums page (query key). The
 * `draft` filter follows every keystroke; the `applied` filter — what the
 * album query actually uses — trails it by a 200ms debounce so typing does
 * not fire an IPC round-trip per character. Applying happens by the page
 * subscribing to the new query key; there is no fetch-watching useEffect.
 *
 * Every change is pushed to `AppSettings.albumFilter` through the injected
 * saver (Main debounces the disk write), and the bootstrap seeds the store
 * from the loaded settings so the last filter survives a restart.
 */

/** UI-facing snapshot: the live controls state and the query's filter. */
export type AlbumFilterSnapshot = {
  /** What the sidebar controls display; follows every change immediately. */
  readonly draft: AlbumFilter;
  /** What the album query uses; trails `draft` by the debounce. */
  readonly applied: AlbumFilter;
};

/** Delay between the last filter change and applying it to the query. */
const APPLY_DELAY_MS = 200;

/**
 * The store class. Holds the immutable snapshot, debounces draft → applied,
 * and forwards every draft change to the injected settings saver.
 */
export class AlbumFilterStore {
  #snapshot: AlbumFilterSnapshot = { draft: {}, applied: {} };
  #listeners = new Set<() => void>();
  #applyTimer: ReturnType<typeof setTimeout> | null = null;
  #save: (filter: AlbumFilter) => void;

  /**
   * @param save - Persists a draft change (production: `mp:settings:set`).
   */
  constructor(save: (filter: AlbumFilter) => void) {
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
  readonly getSnapshot = (): AlbumFilterSnapshot => this.#snapshot;

  /**
   * Seed both draft and applied from the persisted settings. Called once in
   * the bootstrap before the first render — no debounce, no save-back.
   *
   * @param filter - `AppSettings.albumFilter` (or `undefined` when unset).
   */
  initialize(filter: AlbumFilter | undefined): void {
    this.#snapshot = { draft: filter ?? {}, applied: filter ?? {} };
  }

  /**
   * Apply a filter action: update the draft immediately, persist it, and
   * (re)start the debounce that promotes it to `applied`.
   *
   * @param action - The filter change.
   */
  dispatch(action: AlbumFilterAction): void {
    const draft = reduceAlbumFilter(this.#snapshot.draft, action);
    this.#setSnapshot({ ...this.#snapshot, draft });
    this.#save(draft);
    if (this.#applyTimer !== null) {
      clearTimeout(this.#applyTimer);
    }

    this.#applyTimer = setTimeout(() => {
      this.#applyTimer = null;
      this.#setSnapshot({ ...this.#snapshot, applied: this.#snapshot.draft });
    }, APPLY_DELAY_MS);
  }

  #setSnapshot(next: AlbumFilterSnapshot): void {
    this.#snapshot = next;
    for (const listener of [...this.#listeners]) {
      listener();
    }
  }
}

/** The app-wide Album view filter store, wired to the settings channel. */
export const albumFilterStore = new AlbumFilterStore((filter) => {
  void window.mp.settings.set({ patch: { albumFilter: filter } });
});
