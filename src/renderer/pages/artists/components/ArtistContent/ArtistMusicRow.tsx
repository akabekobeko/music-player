import type { Music } from "@mp/ipc";
import { ListEnd, ListStart, NotepadText, Trash2 } from "lucide-react";
import type { MouseEvent } from "react";
import { AddToPlaylistSubmenu } from "@/components/app/AddToPlaylistSubmenu/AddToPlaylistSubmenu";
import { PlayFillIcon } from "@/components/app/Icons/PlayFillIcon";
import { MusicRow } from "@/components/app/MusicRow/MusicRow";
import { useFetchMusicInfoItem } from "@/components/app/RowMenu/useFetchMusicInfoItem";
import { useT } from "@/features/i18n/useT";

type Props = {
  /** The track this row shows. */
  readonly music: Music;
  /** Non-null when this is the current track ("playing" / "paused"). */
  readonly playing: "playing" | "paused" | null;
  /** Whether the row is part of the multi-selection. */
  readonly selected: boolean;
  /**
   * Tracks "Add to playlist" and "Fetch song info" apply to: the
   * multi-selection or this track alone.
   */
  readonly menuTargets: readonly Music[];
  /** Row click; the parent reads Shift / Cmd-Ctrl off the event. */
  readonly onSelect: (event: MouseEvent) => void;
  /** Start playback from this track (hover play / double-click / menu). */
  readonly onPlay: () => void;
  /** Toggle play / pause of the current track (hover pause / play). */
  readonly onTogglePlayPause: () => void;
  /** Menu "Play next"; the parent inserts this track after the current. */
  readonly onPlayNext: () => void;
  /** Menu "Add to queue"; the parent appends this track to the queue. */
  readonly onAddToQueue: () => void;
  /** Menu "Song info"; the parent opens the dialog for the menu targets. */
  readonly onMusicInfo: () => void;
  /** Menu "Remove from library"; the parent removes this track at once. */
  readonly onRemoveFromLibrary: () => void;
};

/**
 * Music area: one track row of the artist view with its menus (the [...]
 * dropdown and the right-click menu, both from `MusicRow`).
 */
export const ArtistMusicRow = ({
  music,
  playing,
  selected,
  menuTargets,
  onSelect,
  onPlay,
  onTogglePlayPause,
  onPlayNext,
  onAddToQueue,
  onMusicInfo,
  onRemoveFromLibrary,
}: Props) => {
  const t = useT();
  const fetchMusicInfoItem = useFetchMusicInfoItem();

  return (
    <MusicRow
      music={music}
      playing={playing}
      selected={selected}
      onClick={onSelect}
      onPlay={onPlay}
      onTogglePlayPause={onTogglePlayPause}
      menuItems={[
        {
          label: t("menu.playMusic"),
          icon: <PlayFillIcon />,
          onSelect: onPlay,
        },
        {
          label: t("menu.playNext"),
          icon: <ListStart />,
          onSelect: onPlayNext,
        },
        {
          label: t("menu.addToQueue"),
          icon: <ListEnd />,
          onSelect: onAddToQueue,
        },
        <AddToPlaylistSubmenu key="playlist" musics={menuTargets} />,
        {
          label: t("menu.musicInfo"),
          icon: <NotepadText />,
          onSelect: onMusicInfo,
          separatorBefore: true,
        },
        fetchMusicInfoItem(menuTargets),
        {
          label: t("menu.removeFromLibrary"),
          icon: <Trash2 />,
          onSelect: onRemoveFromLibrary,
          destructive: true,
          separatorBefore: true,
        },
      ]}
    />
  );
};
