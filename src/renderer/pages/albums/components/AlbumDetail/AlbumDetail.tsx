import type { AlbumSummary, Music } from "@mp/ipc";
import { Play } from "lucide-react";
import { AddToPlaylistSubmenu } from "@/components/app/AddToPlaylistSubmenu/AddToPlaylistSubmenu";
import { MusicRow } from "@/components/app/MusicList/MusicList";
import { RowMenu } from "@/components/app/RowMenu/RowMenu";
import { Button } from "@/components/ui/button";
import { useT } from "@/features/i18n/useT";
import { queryKeys } from "@/features/library/queryStore";
import { useLibraryQuery } from "@/features/library/useLibraryQuery";
import {
  usePlaybackState,
  usePlayerCommands,
  usePlayerState,
} from "@/features/player/PlayerProvider";
import { formatTime } from "@/libs/formatTime";

/**
 * Inline album detail under the expanded card
 * (`docs/specs/v1.0/features/album-view.md`): header (Play / menu) and the
 * track list via the shared `MusicRow` (disc split, row menu, playing
 * highlight). Every playback action queues **only this album's tracks** —
 * unlike the Artist view, the filter context means "listen to this album".
 */
export const AlbumDetail = ({ album }: { readonly album: AlbumSummary }) => {
  const t = useT();
  const musicsState = useLibraryQuery<readonly Music[]>(
    queryKeys.musicsByAlbum(album.albumKey),
  );
  const commands = usePlayerCommands();
  const { current } = usePlayerState();
  const playbackState = usePlaybackState();

  const musics = musicsState.status === "success" ? musicsState.value : [];
  const discNumbers = [...new Set(musics.map((music) => music.disc))];

  const playFrom = (music: Music): void => {
    void commands.playMusic(music, [...musics], "album");
  };

  const playAll = (): void => {
    const first = musics[0];
    if (first !== undefined) {
      playFrom(first);
    }
  };

  const removeFromLibrary = (music: Music): void => {
    void window.mp.library.removeMusics({ musicIds: [music.id] });
    // The broadcast mp:library:changed invalidates the query store, which
    // refetches this panel automatically.
  };

  const playingStateOf = (music: Music): "playing" | "paused" | null => {
    if (current === null || current.id !== music.id) {
      return null;
    }

    return playbackState === "playing" ? "playing" : "paused";
  };

  return (
    <div className="rounded-md border bg-muted/30 px-4 py-3">
      <header className="flex items-center gap-3 pb-2">
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-medium text-base">{album.album}</h2>
          <p className="truncate text-muted-foreground text-xs">
            {[
              album.artist,
              album.year !== null ? String(album.year) : null,
              album.genre !== "" ? album.genre : null,
              t("artist.songs", { count: album.musicCount }),
              formatTime(album.totalDurationMs / 1000),
            ]
              .filter((part) => part !== null)
              .join(" · ")}
          </p>
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
                      <AddToPlaylistSubmenu key="playlist" musics={[music]} />,
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
  );
};
