import type { Music } from "@mp/ipc";

/**
 * Swap every track of `musics` whose id appears in `list` for its new value,
 * keeping the order (`docs/specs/v1.1/features/library-refresh.md`, current
 * queue and track). Tracks not in `musics` are left as they are, ids that
 * are not in the list are ignored.
 *
 * @param list - Queue (or any track list).
 * @param musics - Updated tracks, as re-read after an edit.
 * @returns The list with the updated tracks swapped in; the same instance
 *   when nothing matched.
 */
export const replaceMusics = (
  list: readonly Music[],
  musics: readonly Music[],
): readonly Music[] => {
  const byId = new Map(musics.map((music) => [music.id, music]));
  return list.some((entry) => byId.has(entry.id))
    ? list.map((entry) => byId.get(entry.id) ?? entry)
    : list;
};

/**
 * The updated value of one track, or the track itself when it was not
 * updated (the current track of the player).
 *
 * @param music - The track, or `null` when none is loaded.
 * @param musics - Updated tracks.
 * @returns The track to show from now on.
 */
export const replaceMusic = (
  music: Music | null,
  musics: readonly Music[],
): Music | null =>
  music === null
    ? null
    : (musics.find((entry) => entry.id === music.id) ?? music);
