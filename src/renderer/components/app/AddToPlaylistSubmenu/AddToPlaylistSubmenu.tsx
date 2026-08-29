import type { Music, Playlist } from "@mp/ipc";
import { ListMusic, ListPlus, Plus } from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { useT } from "@/features/i18n/useT";
import { queryKeys } from "@/features/library/queryStore/queryKeys";
import { useLibraryQuery } from "@/features/library/useLibraryQuery";
import { addToPlaylistStore } from "@/features/playlist/addToPlaylistStore";
import { appendMusicsToPlaylist } from "@/features/playlist/playlistCommands/appendMusicsToPlaylist";
import { toastStore } from "@/features/toast/toastStore";

type Props = {
  /** Tracks to add, already in the intended append order. */
  readonly musics: readonly Music[];
};

/**
 * "Add to playlist ▸" submenu shared by every track / album / artist menu
 * (`docs/specs/v1.0/features/playlist.md`): existing static playlists plus
 * "New playlist". Appends to the tail; duplicates are allowed without
 * confirmation. Render inside a `RowMenu` via its node-entry support.
 *
 * "New playlist" only stashes the tracks in the app-level flow store — the
 * name dialog lives in the AppLayout because this menu unmounts on close.
 */
export const AddToPlaylistSubmenu = ({ musics }: Props) => {
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

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger disabled={musics.length === 0}>
        <ListPlus />
        {t("menu.addToPlaylist")}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {playlists.map((playlist) => (
          <DropdownMenuItem
            key={playlist.id}
            onClick={() => void append(playlist)}
          >
            <ListMusic />
            {playlist.name}
          </DropdownMenuItem>
        ))}
        {playlists.length > 0 && <DropdownMenuSeparator />}
        <DropdownMenuItem onClick={() => addToPlaylistStore.open(musics)}>
          <Plus />
          {t("playlist.new")}…
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
};
