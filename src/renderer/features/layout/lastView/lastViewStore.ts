import type { LastView } from "@mp/ipc";

/**
 * Fold a visited view into the remembered one: the section becomes current,
 * and only that section's selection is replaced (the other sections keep
 * theirs). Visiting a section root clears its selection — the root is only
 * reached when the selection was removed or could not be restored.
 *
 * @param current - Remembered view.
 * @param visit - View derived from the new route (`lastViewOf`).
 * @returns The next remembered view.
 */
export const recordVisit = (current: LastView, visit: LastView): LastView => {
  const artist = visit.section === "artists" ? visit.artist : current.artist;
  const playlist =
    visit.section === "playlists" ? visit.playlist : current.playlist;
  return {
    section: visit.section,
    ...(artist !== undefined ? { artist } : {}),
    ...(playlist !== undefined ? { playlist } : {}),
  };
};

/**
 * Remembers the current section and each section's last sidebar selection
 * (`docs/specs/v1.0/renderer/routing-layout.md`). The Sidebar's tabs link to
 * the remembered selection, and every change is persisted as
 * `AppSettings.lastView` for the next launch.
 */
export class LastViewStore {
  #snapshot: LastView = { section: "artists" };
  #listeners = new Set<() => void>();
  #save: (view: LastView) => void;

  /**
   * @param save - Persists a change (production: `mp:settings:set`).
   */
  constructor(save: (view: LastView) => void) {
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
  readonly getSnapshot = (): LastView => this.#snapshot;

  /**
   * Seed the store from the (already resolved) persisted view. Called once
   * in the bootstrap before the first render — no save-back.
   *
   * @param view - Resolved `AppSettings.lastView`, or `undefined` when unset.
   */
  initialize(view: LastView | undefined): void {
    if (view !== undefined) {
      this.#snapshot = view;
    }
  }

  /**
   * Record a route visit and persist the result.
   *
   * @param visit - View derived from the route (`lastViewOf`).
   */
  record(visit: LastView): void {
    const next = recordVisit(this.#snapshot, visit);
    if (
      next.section === this.#snapshot.section &&
      next.artist === this.#snapshot.artist &&
      next.playlist === this.#snapshot.playlist
    ) {
      return;
    }

    this.#snapshot = next;
    this.#save(next);
    for (const listener of [...this.#listeners]) {
      listener();
    }
  }
}

/** The app-wide last-view store, wired to the settings channel. */
export const lastViewStore = new LastViewStore((lastView) => {
  void window.mp.settings.set({ patch: { lastView } });
});
