import { libraryStore } from "../../library/queryStore/libraryStore";
import { queryKeys } from "../../library/queryStore/queryKeys";
import { playlistRouteId } from "../playlistRouteId";
import type { PlaylistRef } from "../types";

/**
 * Invalidate the playlist list and, when given, one playlist's tracks.
 *
 * Shared by every playlist mutation command
 * (`docs/specs/v1.0/features/playlist.md`): run the IPC, then invalidate the
 * affected query-store keys so every subscribed view refetches. There is no
 * push channel for playlist changes — the single window is always the
 * mutation's origin.
 */
export const invalidate = (ref?: PlaylistRef): void => {
  libraryStore.invalidate(queryKeys.playlists);
  if (ref !== undefined) {
    libraryStore.invalidate(queryKeys.musicsByPlaylist(playlistRouteId(ref)));
  }
};
