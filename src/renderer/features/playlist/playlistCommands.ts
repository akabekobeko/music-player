import type { Music, Playlist, PlaylistUpdateRequest } from "@mp/ipc";
import { libraryStore, queryKeys } from "../library/queryStore";
import { type PlaylistRef, playlistRouteId } from "./routeId";

/**
 * Playlist mutation commands (`docs/specs/v1.0/features/playlist.md`).
 *
 * Thin event-handler functions over the `mp:playlist:*` channels: run the
 * IPC, then invalidate the affected query-store keys so every subscribed
 * view refetches. There is no push channel for playlist changes — the single
 * window is always the mutation's origin.
 *
 * Each command returns the IPC failure (or `null` on success) so callers can
 * surface errors; failures never throw.
 */

/** Invalidate the playlist list and, when given, one playlist's tracks. */
const invalidate = (ref?: PlaylistRef): void => {
  libraryStore.invalidate(queryKeys.playlists);
  if (ref !== undefined) {
    libraryStore.invalidate(queryKeys.musicsByPlaylist(playlistRouteId(ref)));
  }
};

/** Normalise a rejected invoke / error result into a message. */
const messageOf = (reason: unknown): string =>
  reason instanceof Error ? reason.message : String(reason);

/**
 * Create a static playlist.
 *
 * @param name - Display name (e.g. the "New playlist" default).
 * @returns The created playlist, or `null` on failure (already logged).
 */
export const createStaticPlaylist = async (
  name: string,
): Promise<Playlist | null> => {
  try {
    const result = await window.mp.playlist.create({ kind: "static", name });
    if (!result.ok) {
      console.error("Failed to create playlist", result.error);
      return null;
    }

    invalidate();
    return result.value;
  } catch (reason) {
    console.error("Failed to create playlist", messageOf(reason));
    return null;
  }
};

/**
 * Apply an update patch (rename, reorder, track replacement, …).
 *
 * @param request - `mp:playlist:update` payload.
 * @returns The updated playlist, or `null` on failure (already logged).
 */
export const updatePlaylist = async (
  request: PlaylistUpdateRequest,
): Promise<Playlist | null> => {
  try {
    const result = await window.mp.playlist.update(request);
    if (!result.ok) {
      console.error("Failed to update playlist", result.error);
      return null;
    }

    invalidate({ id: request.id, kind: request.kind });
    return result.value;
  } catch (reason) {
    console.error("Failed to update playlist", messageOf(reason));
    return null;
  }
};

/**
 * Delete a playlist.
 *
 * @param ref - Target playlist.
 * @returns Whether the deletion succeeded (failures are logged).
 */
export const removePlaylist = async (ref: PlaylistRef): Promise<boolean> => {
  try {
    const result = await window.mp.playlist.remove(ref);
    if (!result.ok) {
      console.error("Failed to remove playlist", result.error);
      return false;
    }

    invalidate(ref);
    return true;
  } catch (reason) {
    console.error("Failed to remove playlist", messageOf(reason));
    return false;
  }
};

/**
 * Replace a static playlist's full track order (reorder / row removal).
 *
 * @param id - Static playlist id.
 * @param musics - The complete new order.
 * @returns Whether the update succeeded.
 */
export const replacePlaylistMusics = async (
  id: number,
  musics: readonly Music[],
): Promise<boolean> =>
  (await updatePlaylist({
    id,
    kind: "static",
    musicIds: musics.map((music) => music.id),
  })) !== null;
