import type { MenuAction } from "@mp/ipc";

/**
 * Tiny event target between the app-lifetime `mp:menu:action` subscription
 * (registered in the bootstrap, before React mounts) and whichever component
 * or command wants to react to a native menu item.
 *
 * React-free by design (`docs/specs/v1.0/renderer/routing-layout.md`):
 * components read it via `useSyncExternalStore`-style subscribe, or commands
 * subscribe directly.
 */

type Listener = (action: MenuAction) => void;

const listeners = new Set<Listener>();

export const menuActionBus = {
  /**
   * Register a listener for menu actions.
   *
   * @param listener - Called with each published action.
   * @returns Unsubscribe function.
   */
  subscribe: (listener: Listener): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  /**
   * Broadcast a menu action to every listener.
   *
   * @param action - The action pushed by Main.
   */
  publish: (action: MenuAction): void => {
    for (const listener of [...listeners]) {
      listener(action);
    }
  },
};
