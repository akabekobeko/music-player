import type { Music } from "@mp/ipc";

/**
 * Drop repeated tracks, keeping the first occurrence of each id in order.
 * The Playlist view selects rows (positions) and the same track may sit on
 * several rows, but the dialog and "Add to playlist" take tracks
 * (`docs/specs/v1.1/features/selection.md`).
 *
 * @param musics - Tracks, possibly repeated.
 * @returns The distinct tracks in first-occurrence order.
 */
export const uniqueMusics = (musics: readonly Music[]): readonly Music[] => {
  const seen = new Set<number>();
  return musics.filter((music) => {
    if (seen.has(music.id)) {
      return false;
    }

    seen.add(music.id);
    return true;
  });
};
