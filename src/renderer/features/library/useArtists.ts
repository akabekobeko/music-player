import type { Artist } from "@mp/ipc";
import { useSyncExternalStore } from "react";
import { type FetchState, libraryStore, queryKeys } from "./queryStore";

// Module-scope so both functions keep a stable identity —
// `useSyncExternalStore` re-subscribes whenever the subscribe reference
// changes, which must not happen once per render.
const subscribeArtists = (listener: () => void): (() => void) =>
  libraryStore.subscribe(queryKeys.artists, listener);
const getArtistsSnapshot = (): FetchState<readonly Artist[]> =>
  libraryStore.getSnapshot<readonly Artist[]>(queryKeys.artists);

/**
 * Subscribe to the artist list
 * (`docs/specs/v1.0/renderer/state-management.md`).
 *
 * The fetch runs inside the query store (first subscribe / invalidation) —
 * never from a render or an effect. `mp:library:changed` invalidates the
 * key via the bootstrap subscription, so imports refresh the list
 * automatically.
 *
 * @returns The artist list fetch state; errors surface to the UI.
 */
export const useArtists = (): FetchState<readonly Artist[]> =>
  useSyncExternalStore(subscribeArtists, getArtistsSnapshot);
