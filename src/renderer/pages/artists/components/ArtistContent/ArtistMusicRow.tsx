import type { Music } from "@mp/ipc";
import type { MouseEvent } from "react";
import { AddToPlaylistSubmenu } from "@/components/app/AddToPlaylistSubmenu/AddToPlaylistSubmenu";
import { MusicRow } from "@/components/app/MusicList/MusicList";
import { RowMenu } from "@/components/app/RowMenu/RowMenu";
import { useT } from "@/features/i18n/useT";
import { musicInfoStore } from "@/features/library/musicInfoStore";

type Props = {
  readonly music: Music;
  readonly playing: "playing" | "paused" | null;
  readonly selected: boolean;
  /** "Add to playlist" targets: the multi-selection or this track alone. */
  readonly playlistTargets: readonly Music[];
  readonly onSelect: (event: MouseEvent) => void;
  readonly onPlay: () => void;
  readonly onPlayNext: () => void;
  readonly onAddToQueue: () => void;
  readonly onRemoveFromLibrary: () => void;
};

/**
 * Music area: one track row of the artist view with its context menu.
 */
export const ArtistMusicRow = ({
  music,
  playing,
  selected,
  playlistTargets,
  onSelect,
  onPlay,
  onPlayNext,
  onAddToQueue,
  onRemoveFromLibrary,
}: Props) => {
  const t = useT();

  return (
    <MusicRow
      music={music}
      playing={playing}
      selected={selected}
      onClick={onSelect}
      onPlay={onPlay}
      menu={
        <RowMenu
          items={[
            { label: t("player.play"), onSelect: onPlay },
            { label: t("menu.playNext"), onSelect: onPlayNext },
            { label: t("menu.addToQueue"), onSelect: onAddToQueue },
            <AddToPlaylistSubmenu key="playlist" musics={playlistTargets} />,
            {
              label: t("menu.musicInfo"),
              onSelect: () => musicInfoStore.open(music),
              separatorBefore: true,
            },
            {
              label: t("menu.removeFromLibrary"),
              onSelect: onRemoveFromLibrary,
              destructive: true,
              separatorBefore: true,
            },
          ]}
        />
      }
    />
  );
};
