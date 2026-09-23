import type { UpdateProgressPayload } from "@mp/ipc";

/**
 * Latest `mp:library:updateProgress` push, readable through
 * `useSyncExternalStore` for the lifetime of the music info dialog.
 *
 * The IPC subscription is held only while someone listens (first
 * subscriber attaches it, last one detaches), so nothing runs while the
 * dialog is closed. `reset` clears the last payload before a new run so a
 * stale "3 / 3" never shows up.
 */
export class UpdateProgressStore {
  #latest: UpdateProgressPayload | null = null;
  #listeners = new Set<() => void>();
  #detach: (() => void) | null = null;
  readonly #attach: (
    listener: (payload: UpdateProgressPayload) => void,
  ) => () => void;

  /**
   * @param attach - Subscribes to the push channel; defaults to the bridge.
   */
  constructor(
    attach: (
      listener: (payload: UpdateProgressPayload) => void,
    ) => () => void = (listener) =>
      window.mp.library.onUpdateProgress(listener),
  ) {
    this.#attach = attach;
  }

  /** Register a listener. Stable identity (class property). */
  readonly subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    if (this.#detach === null) {
      this.#detach = this.#attach((payload) => {
        this.#latest = payload;
        this.#notify();
      });
    }

    return () => {
      this.#listeners.delete(listener);
      if (this.#listeners.size === 0 && this.#detach !== null) {
        this.#detach();
        this.#detach = null;
      }
    };
  };

  /** Read the latest progress (`null` before the first push of a run). */
  readonly getSnapshot = (): UpdateProgressPayload | null => this.#latest;

  /** Forget the previous run's progress. */
  reset(): void {
    if (this.#latest !== null) {
      this.#latest = null;
      this.#notify();
    }
  }

  #notify(): void {
    for (const listener of [...this.#listeners]) {
      listener();
    }
  }
}

/** The app-wide update progress store. */
export const updateProgressStore = new UpdateProgressStore();
