import type { Music } from "@mp/ipc";
import { queryKeys } from "./queryStore/queryKeys";
import type { FetchState } from "./queryStore/types";
import { useLibraryQuery } from "./useLibraryQuery";

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
