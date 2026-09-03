import type { AlbumSummary } from "@mp/ipc";
import { ListEnd, ListStart, NotepadText, Trash2 } from "lucide-react";
import { AddToPlaylistSubmenu } from "@/components/app/AddToPlaylistSubmenu/AddToPlaylistSubmenu";
import { CircleIconButton } from "@/components/app/Buttons/CircleIconButton";
import { EllipsisText } from "@/components/app/EllipsisText/EllipsisText";
import { PlayFillIcon } from "@/components/app/Icons/PlayFillIcon";
import { MusicRow } from "@/components/app/MusicRow/MusicRow";
import { RowMenu } from "@/components/app/RowMenu/RowMenu";
import { HStack } from "@/components/app/stacks";
import { useT } from "@/features/i18n/useT";
import { albumInfoStore } from "@/features/library/albumInfoStore";
import { musicInfoStore } from "@/features/library/musicInfoStore";
import { formatTime } from "@/libs/formatTime";
import { useAlbumDetail } from "./useAlbumDetail";

type Props = {
  readonly album: AlbumSummary;
};

/**
 * Album detail filling the resizable pane below the grid
 * (`docs/specs/v1.0/features/album-view.md`): a fixed header (album info,
 * Play / menu circles) over the scrollable track list via the shared
 * `MusicRow`. The header's right padding matches the list's `px-6` plus the
 * rows' `px-2`, so the menu circle lines up with the track menus (as in the
 * Artist view). Each playback action queues
 * **only this album's tracks** — unlike the Artist view, the filter context
 * means "listen to this album".
 */
export const AlbumDetail = ({ album }: Props) => {
  const t = useT();
  const {
    musics,
    musicsState,
    discNumbers,
    commands,
    playFrom,
    playAll,
    removeFromLibrary,
    playingStateOf,
  } = useAlbumDetail(album.albumKey);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b py-3 pr-8 pl-6">
        <div className="min-w-0 flex-1">
          <h2 className="font-medium text-base">
            <EllipsisText text={album.album} />
          </h2>
          <EllipsisText
            className="text-muted-foreground text-xs"
            text={[
              album.artist,
              album.year !== null ? String(album.year) : null,
              album.genre !== "" ? album.genre : null,
              t("artist.songs", { count: album.musicCount }),
              formatTime(album.totalDurationMs / 1000),
            ]
              .filter((part) => part !== null)
              .join(" · ")}
          />
        </div>
        <HStack className="shrink-0">
          <CircleIconButton
            aria-label={t("player.play")}
            title={t("player.play")}
            disabled={musics.length === 0}
            onClick={playAll}
          >
            <PlayFillIcon className="size-3.5" />
          </CircleIconButton>
          <RowMenu
            variant="circle"
            items={[
              {
                label: t("player.play"),
                icon: <PlayFillIcon />,
                onSelect: playAll,
              },
              {
                label: t("menu.addToQueue"),
                icon: <ListEnd />,
                onSelect: () => commands.appendToQueue([...musics]),
                disabled: musics.length === 0,
              },
              <AddToPlaylistSubmenu key="playlist" musics={musics} />,
              {
                label: t("menu.albumInfo"),
                icon: <NotepadText />,
                onSelect: () => albumInfoStore.open(album),
                separatorBefore: true,
              },
            ]}
          />
        </HStack>
      </header>

      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-6 py-2">
        {musicsState.status === "error" && (
          <p className="break-all py-2 text-destructive text-sm">
            {t("library.loadFailed", { message: musicsState.error.message })}
          </p>
        )}

        {discNumbers.map((disc) => (
          <div key={disc}>
            {discNumbers.length > 1 && (
              <p className="flex h-8 items-end px-2 font-medium text-muted-foreground text-xs">
                {t("album.disc", { number: disc })}
              </p>
            )}
            {musics
              .filter((music) => music.disc === disc)
              .map((music) => (
                <MusicRow
                  key={music.id}
                  music={music}
                  playing={playingStateOf(music)}
                  onPlay={() => playFrom(music)}
                  onTogglePlayPause={() => commands.togglePlayPause()}
                  menu={
                    <RowMenu
                      items={[
                        {
                          label: t("player.play"),
                          icon: <PlayFillIcon />,
                          onSelect: () => playFrom(music),
                        },
                        {
                          label: t("menu.playNext"),
                          icon: <ListStart />,
                          onSelect: () => commands.insertNext([music]),
                        },
                        {
                          label: t("menu.addToQueue"),
                          icon: <ListEnd />,
                          onSelect: () => commands.appendToQueue([music]),
                        },
                        <AddToPlaylistSubmenu
                          key="playlist"
                          musics={[music]}
                        />,
                        {
                          label: t("menu.musicInfo"),
                          icon: <NotepadText />,
                          onSelect: () => musicInfoStore.open(music),
                          separatorBefore: true,
                        },
                        {
                          label: t("menu.removeFromLibrary"),
                          icon: <Trash2 />,
                          onSelect: () => removeFromLibrary(music),
                          destructive: true,
                          separatorBefore: true,
                        },
                      ]}
                    />
                  }
                />
              ))}
          </div>
        ))}
      </div>
    </div>
  );
};
