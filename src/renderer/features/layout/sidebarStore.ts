/**
 * Open / closed state of the sidebar column
 * (`docs/specs/v1.0/renderer/routing-layout.md`).
 *
 * React-free store consumed via `useSyncExternalStore`, shared by the
 * sidebar toolbar (the toggle lives there while open) and the content
 * toolbar (which hosts the replacement icon cluster while closed). Session
 * scoped — the window always opens with the sidebar visible.
 */
export class SidebarStore {
  #open = true;
  #listeners = new Set<() => void>();

  /** Register a snapshot listener. Stable identity (class property). */
  readonly subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  /** Whether the sidebar is visible. Pure; stable until the next change. */
  readonly getSnapshot = (): boolean => this.#open;

  /** Flip the sidebar between open and closed. */
  toggle(): void {
    this.#open = !this.#open;
    for (const listener of [...this.#listeners]) {
      listener();
    }
  }
}

/** The app-wide sidebar visibility store. */
export const sidebarStore = new SidebarStore();
