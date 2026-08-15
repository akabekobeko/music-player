import type { AlbumSummary } from "@mp/ipc";
import { Play } from "lucide-react";
import { AddToPlaylistSubmenu } from "@/components/app/AddToPlaylistSubmenu/AddToPlaylistSubmenu";
import { EllipsisText } from "@/components/app/EllipsisText/EllipsisText";
import { MusicRow } from "@/components/app/MusicList/MusicList";
import { RowMenu } from "@/components/app/RowMenu/RowMenu";
import { Button } from "@/components/ui/button";
import { useT } from "@/features/i18n/useT";
import { formatTime } from "@/libs/formatTime";
import { useAlbumDetail } from "./useAlbumDetail";

type Props = {
  readonly album: AlbumSummary;
};

/**
 * Album detail filling the resizable pane below the grid
 * (`docs/specs/v1.0/features/album-view.md`): a fixed header (album info,
 * Play / menu) over the scrollable track list via the shared `MusicRow`
 * (disc split, row menu, playing highlight). Every playback action queues
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
      <header className="flex items-center gap-3 border-b px-6 py-3">
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
        <Button size="sm" disabled={musics.length === 0} onClick={playAll}>
          <Play /> {t("player.play")}
        </Button>
        <RowMenu
          items={[
            { label: t("player.play"), onSelect: playAll },
            {
              label: t("menu.addToQueue"),
              onSelect: () => commands.appendToQueue([...musics]),
              disabled: musics.length === 0,
            },
            <AddToPlaylistSubmenu key="playlist" musics={musics} />,
          ]}
        />
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
                  menu={
                    <RowMenu
                      items={[
                        {
                          label: t("player.play"),
                          onSelect: () => playFrom(music),
                        },
                        {
                          label: t("menu.playNext"),
                          onSelect: () => commands.insertNext([music]),
                        },
                        {
                          label: t("menu.addToQueue"),
                          onSelect: () => commands.appendToQueue([music]),
                        },
                        <AddToPlaylistSubmenu
                          key="playlist"
                          musics={[music]}
                        />,
                        {
                          label: t("menu.removeFromLibrary"),
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
