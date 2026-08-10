import type { Music } from "@mp/ipc";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Disc3, Play, Shuffle as ShuffleIcon, UserRound } from "lucide-react";
import { useRef, useState } from "react";
import { useParams } from "react-router";
import { MusicRow } from "@/components/app/MusicList/MusicList";
import { RowMenu } from "@/components/app/RowMenu/RowMenu";
import { Button } from "@/components/ui/button";
import { useT } from "@/features/i18n/useT";
import {
  type AlbumGroup,
  flattenAlbumMusics,
  groupAlbums,
} from "@/features/library/groupAlbums";
import { useArtistMusics, useArtists } from "@/features/library/useArtists";
import {
  usePlaybackState,
  usePlayerCommands,
  usePlayerState,
} from "@/features/player/PlayerProvider";
import { shuffle } from "@/features/player/shuffle";
import { formatTime } from "@/libs/formatTime";
import { toMediaFileUrl } from "@/libs/mediaUrl";
import { ALBUM_ROW_HEIGHTS, buildAlbumRows } from "./albumRows";
import {
  applySelectionClick,
  EMPTY_SELECTION,
  type SelectionState,
} from "./selection";

/**
 * Artist view content (`/artists/:artistName`)
 * (`docs/specs/v1.0/features/artist-view.md`): header (Play / Shuffle /
 * menu), album sections, and the playback wiring — every action only calls
 * PlayerCommands; the view never manages queue contents itself.
 */
export const ArtistsPage = () => {
  const t = useT();
  const { artistName } = useParams();
  return (
    <div className="h-full">
      {artistName !== undefined ? (
        <ArtistContent key={artistName} artistName={artistName} />
      ) : (
        <section className="p-6">
          <p className="text-muted-foreground text-sm">
            {t("artist.selectPrompt")}
          </p>
        </section>
      )}
    </div>
  );
};

/** Selected-artist content; remounted per artist via the `key` above. */
const ArtistContent = ({ artistName }: { readonly artistName: string }) => {
  const t = useT();
  const artistsState = useArtists();
  const musicsState = useArtistMusics(artistName);
  const commands = usePlayerCommands();
  const { current } = usePlayerState();
  const playbackState = usePlaybackState();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [selection, setSelection] = useState<SelectionState>(EMPTY_SELECTION);

  const musics = musicsState.status === "success" ? musicsState.value : [];
  const groups = groupAlbums(musics);
  const rows = buildAlbumRows(groups);
  // The artist's full play order — every playback action queues this
  // (album year order → disc → track), so listening continues across albums.
  const playOrder = flattenAlbumMusics(groups);
  const orderedIds = playOrder.map((music) => music.id);
  const artist =
    artistsState.status === "success"
      ? (artistsState.value.find((entry) => entry.name === artistName) ?? null)
      : null;

  const playAll = (): void => {
    const first = playOrder[0];
    if (first !== undefined) {
      void commands.playMusic(first, playOrder, "artist");
    }
  };

  const playShuffled = (): void => {
    const shuffled = shuffle(playOrder);
    const first = shuffled[0];
    if (first !== undefined) {
      void commands.playMusic(first, shuffled, "artist");
    }
  };

  const playFrom = (music: Music): void => {
    void commands.playMusic(music, playOrder, "artist");
  };

  const playAlbum = (group: AlbumGroup): void => {
    const albumMusics = group.discs.flatMap((disc) => [...disc.musics]);
    const first = albumMusics[0];
    if (first !== undefined) {
      void commands.playMusic(first, albumMusics, "artist");
    }
  };

  const albumMusicsOf = (group: AlbumGroup): Music[] =>
    group.discs.flatMap((disc) => [...disc.musics]);

  const removeFromLibrary = (music: Music): void => {
    void window.mp.library.removeMusics({ musicIds: [music.id] });
    // The broadcast mp:library:changed invalidates the query store, which
    // refetches this view automatically.
  };

  const playingStateOf = (music: Music): "playing" | "paused" | null => {
    if (current === null || current.id !== music.id) {
      return null;
    }

    return playbackState === "playing" ? "playing" : "paused";
  };

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => {
      const row = rows[index];
      return row !== undefined ? ALBUM_ROW_HEIGHTS[row.type] : 36;
    },
    overscan: 12,
  });

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-4 border-b px-6 py-4">
        {artist?.picturePath != null ? (
          <img
            src={toMediaFileUrl(artist.picturePath)}
            alt=""
            className="size-16 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-muted">
            <UserRound aria-hidden className="size-7 text-muted-foreground" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-semibold text-lg">{artistName}</h1>
          <p className="text-muted-foreground text-sm">
            {t("artist.albumCount", { count: groups.length })}
            {" · "}
            {t("artist.songs", { count: musics.length })}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Button
              size="sm"
              disabled={playOrder.length === 0}
              onClick={playAll}
            >
              <Play /> {t("player.play")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={playOrder.length === 0}
              onClick={playShuffled}
            >
              <ShuffleIcon /> {t("player.shuffle")}
            </Button>
          </div>
        </div>
        <span className="self-start">
          <RowMenu
            items={[
              { label: t("player.play"), onSelect: playAll },
              { label: t("player.shuffle"), onSelect: playShuffled },
              // Wired to the playlist picker in Phase 6.
              { label: t("menu.addToPlaylist"), disabled: true },
            ]}
          />
        </span>
      </header>

      {musicsState.status === "error" && (
        <p className="break-all px-6 py-3 text-destructive text-sm">
          {t("library.loadFailed", { message: musicsState.error.message })}
        </p>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6">
        <div
          className="relative w-full"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualizer.getVirtualItems().map((item) => {
            const row = rows[item.index];
            if (row === undefined) {
              return null;
            }

            return (
              <div
                key={
                  row.type === "album"
                    ? `album:${row.group.key}`
                    : row.type === "disc"
                      ? `disc:${row.albumKey}:${row.disc}`
                      : `music:${row.music.id}`
                }
                className="absolute top-0 left-0 w-full"
                style={{
                  height: item.size,
                  transform: `translateY(${item.start}px)`,
                }}
              >
                {row.type === "album" && (
                  <div className="flex items-end gap-4 pt-6 pb-2">
                    {row.group.picturePath !== null ? (
                      <img
                        src={toMediaFileUrl(row.group.picturePath)}
                        alt=""
                        className="size-28 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <span className="flex size-28 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Disc3
                          aria-hidden
                          className="size-10 text-muted-foreground"
                        />
                      </span>
                    )}
                    <div className="min-w-0 flex-1 pb-1">
                      <h2 className="truncate font-medium text-base">
                        {row.group.album}
                      </h2>
                      <p className="truncate text-muted-foreground text-xs">
                        {[
                          row.group.year !== null
                            ? String(row.group.year)
                            : null,
                          row.group.genre !== "" ? row.group.genre : null,
                          t("artist.songs", { count: row.group.musicCount }),
                          formatTime(row.group.totalDurationMs / 1000),
                        ]
                          .filter((part) => part !== null)
                          .join(" · ")}
                      </p>
                    </div>
                    <RowMenu
                      items={[
                        {
                          label: t("player.play"),
                          onSelect: () => playAlbum(row.group),
                        },
                        {
                          label: t("menu.addToQueue"),
                          onSelect: () =>
                            commands.appendToQueue(albumMusicsOf(row.group)),
                        },
                        { label: t("menu.addToPlaylist"), disabled: true },
                      ]}
                    />
                  </div>
                )}
                {row.type === "disc" && (
                  <p className="flex h-8 items-end px-2 font-medium text-muted-foreground text-xs">
                    {t("album.disc", { number: row.disc })}
                  </p>
                )}
                {row.type === "music" && (
                  <MusicRow
                    music={row.music}
                    playing={playingStateOf(row.music)}
                    selected={selection.selectedIds.has(row.music.id)}
                    onClick={(event) => {
                      setSelection(
                        applySelectionClick(
                          selection,
                          orderedIds,
                          row.music.id,
                          {
                            shift: event.shiftKey,
                            meta: event.metaKey || event.ctrlKey,
                          },
                        ),
                      );
                    }}
                    onPlay={() => playFrom(row.music)}
                    menu={
                      <RowMenu
                        items={[
                          {
                            label: t("player.play"),
                            onSelect: () => playFrom(row.music),
                          },
                          {
                            label: t("menu.playNext"),
                            onSelect: () => commands.insertNext([row.music]),
                          },
                          {
                            label: t("menu.addToQueue"),
                            onSelect: () => commands.appendToQueue([row.music]),
                          },
                          { label: t("menu.addToPlaylist"), disabled: true },
                          {
                            label: t("menu.removeFromLibrary"),
                            onSelect: () => removeFromLibrary(row.music),
                            destructive: true,
                            separatorBefore: true,
                          },
                        ]}
                      />
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
