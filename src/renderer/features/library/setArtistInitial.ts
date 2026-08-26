import type { Artist, IpcError } from "@mp/ipc";
import { libraryStore } from "./queryStore/libraryStore";
import { queryKeys } from "./queryStore/queryKeys";

/**
 * Store or clear an artist's user-chosen initial: run the IPC, then patch
 * the cached artist list in place so the sidebar re-groups the artist
 * immediately without a refetch.
 *
 * @param artist - Display-artist name (the artist list's entry).
 * @param initial - Capital letter A–Z to store, or `null` to clear ("Other").
 * @returns `null` on success, the IPC error otherwise.
 */
export const setArtistInitial = async (
  artist: string,
  initial: string | null,
): Promise<IpcError | null> => {
  const result = await window.mp.library.setArtistInitial({ artist, initial });
  if (!result.ok) {
    return result.error;
  }

  libraryStore.patch<readonly Artist[]>(queryKeys.artists, (artists) =>
    artists.map((entry) =>
      entry.name === artist ? { ...entry, initial } : entry,
    ),
  );
  return null;
};
