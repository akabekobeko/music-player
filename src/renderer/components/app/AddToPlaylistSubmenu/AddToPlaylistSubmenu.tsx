import type { Music } from "@mp/ipc";
import { ListMusic, ListPlus, Plus } from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { useT } from "@/features/i18n/useT";
import { useAddToPlaylistSubmenu } from "./useAddToPlaylistSubmenu";

type Props = {
  /** Tracks to add, already in the intended append order. */
  readonly musics: readonly Music[];
};

/**
 * "Add to playlist ▸" submenu shared by every track / album / artist menu
 * (`docs/specs/v1.0/features/playlist.md`): existing static playlists plus
 * "New playlist". Appends to the tail; duplicates are allowed without
 * confirmation. Render inside a `RowMenu` via its node-entry support. The
 * appending and the "New playlist" flow are in `useAddToPlaylistSubmenu`.
 */
export const AddToPlaylistSubmenu = ({ musics }: Props) => {
  const t = useT();
  const { playlists, append, openNewPlaylist } =
    useAddToPlaylistSubmenu(musics);

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
        <DropdownMenuItem onClick={openNewPlaylist}>
          <Plus />
          {t("playlist.new")}…
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
};
