import { useSyncExternalStore } from "react";
import { libraryStore } from "./queryStore/libraryStore";
import type { FetchState, QueryKey } from "./queryStore/types";

/**
 * Per-key stable subscribe / getSnapshot pairs.
 *
 * `useSyncExternalStore` re-subscribes whenever the subscribe identity
 * changes, so the pair must not be recreated per render. Keyed caching also
 * lets one component switch keys (e.g. navigating between artists) and
 * still hand React a stable pair per key. Bounded by the number of distinct
 * keys ever used; entries are trivially small.
 */
const bindings = new Map<
  QueryKey,
  {
    readonly subscribe: (listener: () => void) => () => void;
    readonly getSnapshot: () => FetchState<unknown>;
  }
>();

const bindingFor = (key: QueryKey) => {
  let binding = bindings.get(key);
  if (binding === undefined) {
    binding = {
      subscribe: (listener) => libraryStore.subscribe(key, listener),
      getSnapshot: () => libraryStore.getSnapshot(key),
    };
    bindings.set(key, binding);
  }

  return binding;
};

/**
 * Subscribe to one library query key
 * (`docs/specs/v1.0/renderer/state-management.md`).
 *
 * @param key - Query key (see `queryKeys`).
 * @returns The fetch state; errors surface to the UI.
 */
export const useLibraryQuery = <T>(key: QueryKey): FetchState<T> => {
  const binding = bindingFor(key);
  return useSyncExternalStore(
    binding.subscribe,
    binding.getSnapshot,
  ) as FetchState<T>;
};
