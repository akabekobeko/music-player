import type { Playlist, PlaylistUpdateRequest } from "@mp/ipc";
import { invalidate } from "./invalidate";
import { messageOf } from "./messageOf";

/**
 * Apply an update patch (rename, reorder, track replacement, …)
 * (`docs/specs/v1.0/features/playlist.md`).
 *
 * Thin event-handler function over `mp:playlist:update`; failures never
 * throw.
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
