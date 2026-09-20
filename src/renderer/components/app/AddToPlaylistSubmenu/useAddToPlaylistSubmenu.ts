import type { Music, Playlist } from "@mp/ipc";
import { useT } from "@/features/i18n/useT";
import { queryKeys } from "@/features/library/queryStore/queryKeys";
import { useLibraryQuery } from "@/features/library/useLibraryQuery";
import { addToPlaylistStore } from "@/features/playlist/addToPlaylistStore";
import { appendMusicsToPlaylist } from "@/features/playlist/playlistCommands/appendMusicsToPlaylist";
import { toastStore } from "@/features/toast/toastStore";

/**
 * Logic of `AddToPlaylistSubmenu`: the static playlists to list (from the
 * library query), appending to one of them with a result toast, and
 * starting the "New playlist" flow (which only stashes the tracks in the
 * app-level store — the name dialog lives in the AppLayout because the menu
 * unmounts on close). `useT` is called here because the toast text is part
 * of the logic, not of the markup.
 *
 * @param musics - Tracks to add, already in the intended append order.
 */
export const useAddToPlaylistSubmenu = (musics: readonly Music[]) => {
  const t = useT();
  const playlistsState = useLibraryQuery<readonly Playlist[]>(
    queryKeys.playlists,
  );
  const playlists =
    playlistsState.status === "success"
      ? playlistsState.value.filter((entry) => entry.kind === "static")
      : [];

  const append = async (playlist: Playlist): Promise<void> => {
    if (await appendMusicsToPlaylist(playlist.id, musics)) {
      toastStore.show(
        t("playlist.addedToast", {
          count: musics.length,
          name: playlist.name,
        }),
      );
    }
  };

  const openNewPlaylist = (): void => {
    addToPlaylistStore.open(musics);
  };

  return { playlists, append, openNewPlaylist };
};
