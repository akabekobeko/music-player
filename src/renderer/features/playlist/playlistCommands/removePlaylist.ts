import type { PlaylistRef } from "../types";
import { invalidate } from "./invalidate";
import { messageOf } from "./messageOf";

/**
 * Delete a playlist (`docs/specs/v1.0/features/playlist.md`).
 *
 * Thin event-handler function over `mp:playlist:remove`; failures never
 * throw.
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
