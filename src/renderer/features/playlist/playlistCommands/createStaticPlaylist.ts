import type { Playlist } from "@mp/ipc";
import { invalidate } from "./invalidate";
import { messageOf } from "./messageOf";

/**
 * Create a static playlist (`docs/specs/v1.0/features/playlist.md`).
 *
 * Thin event-handler function over `mp:playlist:create`; failures never
 * throw.
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
