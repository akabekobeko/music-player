import type { Artist, IpcError } from "@mp/ipc";
import { libraryStore } from "./queryStore/libraryStore";
import { queryKeys } from "./queryStore/queryKeys";

/**
 * Apply a user-selected image to an artist: run the IPC, then patch the
 * cached artist list in place so every view showing the artist (sidebar
 * list, artist header) updates immediately without a refetch.
 *
 * @param artist - Artist name (the `musics.artist` value).
 * @param file - Image file picked in the edit dialog.
 * @returns `null` on success, the IPC error otherwise.
 */
export const setArtistPicture = async (
  artist: string,
  file: File,
): Promise<IpcError | null> => {
  const data = new Uint8Array(await file.arrayBuffer());
  const result = await window.mp.library.setArtistPicture({
    artist,
    mimeType: file.type,
    data,
  });
  if (!result.ok) {
    return result.error;
  }

  libraryStore.patch<readonly Artist[]>(queryKeys.artists, (artists) =>
    artists.map((entry) =>
      entry.name === artist
        ? { ...entry, picturePath: result.value.picturePath }
        : entry,
    ),
  );
  return null;
};
