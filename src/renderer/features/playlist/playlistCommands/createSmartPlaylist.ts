import type { Playlist, SmartPlaylistRules } from "@mp/ipc";
import { invalidate } from "./invalidate";
import { messageOf } from "./messageOf";

/**
 * Create a smart playlist from the rules editor
 * (`docs/specs/v1.0/features/playlist.md`).
 *
 * Thin event-handler function over `mp:playlist:create`; failures never
 * throw.
 *
 * @param name - Display name.
 * @param rules - Rule document from the editor.
 * @returns The created playlist, or `null` on failure (already logged).
 */
export const createSmartPlaylist = async (
  name: string,
  rules: SmartPlaylistRules,
): Promise<Playlist | null> => {
  try {
    const result = await window.mp.playlist.create({
      kind: "smart",
      name,
      rules,
    });
    if (!result.ok) {
      console.error("Failed to create smart playlist", result.error);
      return null;
    }

    invalidate();
    return result.value;
  } catch (reason) {
    console.error("Failed to create smart playlist", messageOf(reason));
    return null;
  }
};
