/**
 * Song-filter texts typed into the content toolbar, one per library section
 * (`docs/specs/v1.0/renderer/routing-layout.md`).
 *
 * React-free store consumed via `useSyncExternalStore`, shared by the
 * toolbar input (controls) and the section views (filtering). Like the
 * album filter, the `draft` value follows every keystroke while `applied` —
 * what the views actually filter with — trails it by a debounce, so the
 * Album view's SQL-backed query does not fire an IPC round-trip per
 * character. Session scoped; nothing is persisted.
 */

/** Library sections owning an independent song-filter text. */
export type TrackFilterSection = "artists" | "albums" | "playlists";

/** Filter text per section. */
export type TrackFilterValues = Readonly<Record<TrackFilterSection, string>>;

/** UI-facing snapshot: the live input values and the views' filter values. */
export type TrackFilterSnapshot = {
  /** What the toolbar inputs display; follows every change immediately. */
  readonly draft: TrackFilterValues;
  /** What the views filter with; trails `draft` by the debounce. */
  readonly applied: TrackFilterValues;
};

/** Delay between the last keystroke and applying it to the views. */
const APPLY_DELAY_MS = 200;

const EMPTY_VALUES: TrackFilterValues = {
  artists: "",
  albums: "",
  playlists: "",
};

/**
 * The store class. Holds the immutable snapshot and debounces
 * draft → applied.
 */
export class TrackFilterStore {
  #snapshot: TrackFilterSnapshot = {
    draft: EMPTY_VALUES,
    applied: EMPTY_VALUES,
  };
  #listeners = new Set<() => void>();
  #applyTimer: ReturnType<typeof setTimeout> | null = null;

  /** Register a snapshot listener. Stable identity (class property). */
  readonly subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  /** Read the current snapshot. Pure; stable until the next change. */
  readonly getSnapshot = (): TrackFilterSnapshot => this.#snapshot;

  /**
   * Update one section's filter text: the draft immediately, the applied
   * value after the debounce.
   *
   * @param section - Section whose input changed.
   * @param text - The new filter text.
   */
  setText(section: TrackFilterSection, text: string): void {
    this.#setSnapshot({
      ...this.#snapshot,
      draft: { ...this.#snapshot.draft, [section]: text },
    });
    if (this.#applyTimer !== null) {
      clearTimeout(this.#applyTimer);
    }

    this.#applyTimer = setTimeout(() => {
      this.#applyTimer = null;
      this.#setSnapshot({ ...this.#snapshot, applied: this.#snapshot.draft });
    }, APPLY_DELAY_MS);
  }

  #setSnapshot(next: TrackFilterSnapshot): void {
    this.#snapshot = next;
    for (const listener of [...this.#listeners]) {
      listener();
    }
  }
}

/** The app-wide song-filter store behind the content toolbar inputs. */
export const trackFilterStore = new TrackFilterStore();
