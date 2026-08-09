import type { Artist, Music } from "@mp/ipc";
import { type FetchState, queryKeys } from "./queryStore";
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

/**
 * Subscribe to one artist's full track list
 * (`docs/specs/v1.0/features/artist-view.md`): the page-level hook —
 * the result stays local to the view, never in global state.
 *
 * @param artist - Artist name from the route parameter.
 * @returns The track list fetch state.
 */
export const useArtistMusics = (artist: string): FetchState<readonly Music[]> =>
  useLibraryQuery(queryKeys.musicsByArtist(artist));
