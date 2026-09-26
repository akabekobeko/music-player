import type { AlbumSummary } from "@mp/ipc";
import { Disc3, ListEnd, ListStart, NotepadText, Trash2 } from "lucide-react";
import { AddToPlaylistSubmenu } from "@/components/app/AddToPlaylistSubmenu/AddToPlaylistSubmenu";
import { CircleIconButton } from "@/components/app/Buttons/CircleIconButton";
import { EllipsisText } from "@/components/app/EllipsisText/EllipsisText";
import { PlayFillIcon } from "@/components/app/Icons/PlayFillIcon";
import { MusicRow } from "@/components/app/MusicRow/MusicRow";
import { RowMenu } from "@/components/app/RowMenu/RowMenu";
import { useFetchMusicInfoItem } from "@/components/app/RowMenu/useFetchMusicInfoItem";
import { HStack } from "@/components/app/stacks";
import { useT } from "@/features/i18n/useT";
import { formatTime } from "@/libs/formatTime";
import { toMediaFileUrl } from "@/libs/toMediaFileUrl";
import { useAlbumDetail } from "./useAlbumDetail";

type Props = {
  /** The expanded album; the header shows it, `albumKey` loads the tracks. */
  readonly album: AlbumSummary;
  /** The grid's albums in display order (the album info dialog's arrows). */
  readonly albums: readonly AlbumSummary[];
};

/**
 * Album detail filling the resizable pane below the grid
 * (`docs/specs/v1.0/features/album-view.md`): a fixed header (artwork,
 * album info, Play / menu circles) over the scrollable track list via the
 * shared `MusicRow`. The artwork identifies the expanded album, since the
 * grid's glow is reserved for the playing one.
 * The header's right padding matches the list's `px-6` plus the
 * rows' `px-2`, so the menu circle lines up with the track menus (as in the
 * Artist view). Each playback action queues
 * **only this album's tracks** — unlike the Artist view, the filter context
 * means "listen to this album". Rows multi-select like the Artist view
 * (click / Shift / Cmd-Ctrl); the row menus ([...] and right-click) act on
 * the selection.
 */
export const AlbumDetail = ({ album, albums }: Props) => {
  const t = useT();
  const fetchMusicInfoItem = useFetchMusicInfoItem();
  const {
    musics,
    musicsState,
    discNumbers,
    selection,
    selectRow,
    menuTargetsOfRow,
    openMusicInfo,
    openAlbumInfo,
    commands,
    playFrom,
    playAll,
    removeFromLibrary,
    playingStateOf,
  } = useAlbumDetail(album, albums);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b py-3 pr-8 pl-6">
        <div className="size-12 shrink-0 overflow-hidden rounded-md bg-muted">
          {album.picturePath !== null ? (
            <img
              src={toMediaFileUrl(album.picturePath)}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <span className="flex size-full items-center justify-center">
              <Disc3 aria-hidden className="size-6 text-muted-foreground" />
            </span>
          )}
        </div>
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
            aria-label={t("menu.playAlbum")}
            title={t("menu.playAlbum")}
            disabled={musics.length === 0}
            onClick={playAll}
          >
            <PlayFillIcon className="size-3.5" />
          </CircleIconButton>
          <RowMenu
            variant="circle"
            items={[
              {
                label: t("menu.playAlbum"),
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
                onSelect: openAlbumInfo,
                separatorBefore: true,
              },
              fetchMusicInfoItem(musics),
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
                  selected={selection.selectedIds.has(music.id)}
                  onClick={(event) => {
                    selectRow(music.id, {
                      shift: event.shiftKey,
                      meta: event.metaKey || event.ctrlKey,
                    });
                  }}
                  onPlay={() => playFrom(music)}
                  onTogglePlayPause={() => commands.togglePlayPause()}
                  menuItems={[
                    {
                      label: t("menu.playMusic"),
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
                      musics={menuTargetsOfRow(music)}
                    />,
                    {
                      label: t("menu.musicInfo"),
                      icon: <NotepadText />,
                      onSelect: () => openMusicInfo(music),
                      separatorBefore: true,
                    },
                    fetchMusicInfoItem(menuTargetsOfRow(music)),
                    {
                      label: t("menu.removeFromLibrary"),
                      icon: <Trash2 />,
                      onSelect: () => removeFromLibrary(music),
                      destructive: true,
                      separatorBefore: true,
                    },
                  ]}
                />
              ))}
          </div>
        ))}
      </div>
    </div>
  );
};
