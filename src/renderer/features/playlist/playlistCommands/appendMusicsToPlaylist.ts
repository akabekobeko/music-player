import type { Music } from "@mp/ipc";
import { messageOf } from "./messageOf";
import { updatePlaylist } from "./updatePlaylist";

/**
 * Append tracks to a static playlist's tail ("Add to playlist ▸")
 * (`docs/specs/v1.0/features/playlist.md`).
 * Duplicates are allowed by design — no confirmation, no de-duplication.
 *
 * @param id - Static playlist id.
 * @param musics - Tracks to append, already in the intended order.
 * @returns Whether the append succeeded (failures are logged).
 */
export const appendMusicsToPlaylist = async (
  id: number,
  musics: readonly Music[],
): Promise<boolean> => {
  try {
    const current = await window.mp.playlist.getMusics({
      playlistId: id,
      kind: "static",
    });
    if (!current.ok) {
      console.error("Failed to read playlist musics", current.error);
      return false;
    }

    return (
      (await updatePlaylist({
        id,
        kind: "static",
        musicIds: [
          ...current.value.map((music) => music.id),
          ...musics.map((music) => music.id),
        ],
      })) !== null
    );
  } catch (reason) {
    console.error("Failed to append to playlist", messageOf(reason));
    return false;
  }
};
