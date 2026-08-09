import { type RefObject, useState, useSyncExternalStore } from "react";

/**
 * Observe an element's content width for the grid's column calculation.
 *
 * External mutable layout state read via `useSyncExternalStore`: subscribe
 * attaches a `ResizeObserver` (which also fires once on `observe`, covering
 * the first post-mount measurement), and the snapshot reads `clientWidth`
 * directly. The binding pair is created once per component so the store is
 * not re-subscribed every render.
 *
 * @param ref - Ref of the observed element (the grid's scroll container).
 * @returns The element's `clientWidth`, or `0` before the first measurement.
 */
export const useElementWidth = (ref: RefObject<HTMLElement | null>): number => {
  const [binding] = useState(() => ({
    subscribe: (listener: () => void): (() => void) => {
      const element = ref.current;
      if (element === null) {
        return () => {};
      }

      const observer = new ResizeObserver(listener);
      observer.observe(element);
      return () => observer.disconnect();
    },
    getSnapshot: (): number => ref.current?.clientWidth ?? 0,
  }));
  return useSyncExternalStore(binding.subscribe, binding.getSnapshot);
};
