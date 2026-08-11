import type { Artist } from "@mp/ipc";
import { queryKeys } from "./queryStore/queryKeys";
import type { FetchState } from "./queryStore/types";
import { useLibraryQuery } from "./useLibraryQuery";

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
  useLibraryQuery(queryKeys.artists);
