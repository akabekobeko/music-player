import type { Music } from "@mp/ipc";
import { updatePlaylist } from "./updatePlaylist";

/**
 * Replace a static playlist's full track order (reorder / row removal)
 * (`docs/specs/v1.0/features/playlist.md`).
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
