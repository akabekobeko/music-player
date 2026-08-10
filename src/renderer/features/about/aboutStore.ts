import type { IpcError, Versions } from "@mp/ipc";

/**
 * State of the about dialog (`mp:menu:action` → `showAbout`).
 *
 * React-free store consumed via `useSyncExternalStore`; opening fetches the
 * runtime versions through the injected loader (event-handler fetch — never
 * an effect). The dialog component lives in the AppLayout.
 */

/** UI-facing state of the about dialog. */
export type AboutState =
  | { readonly open: false }
  | {
      readonly open: true;
      /** `null` while the versions request is in flight. */
      readonly versions: Versions | null;
      readonly error: IpcError | null;
    };

const CLOSED: AboutState = { open: false };

/** The store class; versions load on every open (they cannot change, but
 * the request is trivial and keeps the store stateless across opens). */
export class AboutStore {
  #state: AboutState = CLOSED;
  #listeners = new Set<() => void>();
  #load: () => Promise<
    { ok: true; value: Versions } | { ok: false; error: IpcError }
  >;

  /**
   * @param load - Versions loader (production: `mp:app:getVersions`).
   */
  constructor(
    load: () => Promise<
      { ok: true; value: Versions } | { ok: false; error: IpcError }
    >,
  ) {
    this.#load = load;
  }

  /** Register a listener. Stable identity (class property). */
  readonly subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  /** Read the current state. Stable until the next change. */
  readonly getSnapshot = (): AboutState => this.#state;

  /** Open the dialog and start the versions request. */
  open(): void {
    this.#set({ open: true, versions: null, error: null });
    void this.#load().then((result) => {
      if (!this.#state.open) {
        return; // Closed while loading — discard.
      }

      this.#set(
        result.ok
          ? { open: true, versions: result.value, error: null }
          : { open: true, versions: null, error: result.error },
      );
    });
  }

  /** Close the dialog. */
  close(): void {
    this.#set(CLOSED);
  }

  #set(next: AboutState): void {
    this.#state = next;
    for (const listener of [...this.#listeners]) {
      listener();
    }
  }
}

/** The app-wide about-dialog store, wired to `window.mp`. */
export const aboutStore = new AboutStore(() => window.mp.app.getVersions());
