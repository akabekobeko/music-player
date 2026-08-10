/**
 * Minimal toast notifications (first consumer: "Added to playlist"
 * feedback, `docs/specs/v1.0/features/playlist.md`).
 *
 * React-free store consumed via `useSyncExternalStore`; the `Toaster`
 * component renders the queue. Self-written on purpose — a toast library
 * would be an external dependency for a screenful of code.
 */

/** One visible toast. */
export type Toast = {
  readonly id: number;
  readonly message: string;
};

/** How long a toast stays visible. */
const DURATION_MS = 3000;

/** The store class: an id-stamped queue with auto-dismiss timers. */
export class ToastStore {
  #toasts: readonly Toast[] = [];
  #listeners = new Set<() => void>();
  #nextId = 1;

  /** Register a listener. Stable identity (class property). */
  readonly subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  /** Read the visible toasts. Stable until the next change. */
  readonly getSnapshot = (): readonly Toast[] => this.#toasts;

  /**
   * Show a toast; it dismisses itself after {@link DURATION_MS}.
   *
   * @param message - Localised display text.
   */
  show(message: string): void {
    const id = this.#nextId;
    this.#nextId += 1;
    this.#set([...this.#toasts, { id, message }]);
    setTimeout(() => {
      this.dismiss(id);
    }, DURATION_MS);
  }

  /**
   * Remove one toast (auto-dismiss or click).
   *
   * @param id - Toast id; unknown ids are a no-op.
   */
  dismiss(id: number): void {
    if (this.#toasts.some((toast) => toast.id === id)) {
      this.#set(this.#toasts.filter((toast) => toast.id !== id));
    }
  }

  #set(next: readonly Toast[]): void {
    this.#toasts = next;
    for (const listener of [...this.#listeners]) {
      listener();
    }
  }
}

/** The app-wide toast store. */
export const toastStore = new ToastStore();
