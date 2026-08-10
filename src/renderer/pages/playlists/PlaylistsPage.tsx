import type { Music, Playlist } from "@mp/ipc";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ListMusic, Play, Shuffle as ShuffleIcon } from "lucide-react";
import { useRef, useState } from "react";
import { useParams } from "react-router";
import {
  MUSIC_ROW_HEIGHT,
  MusicRow,
} from "@/components/app/MusicList/MusicList";
import { RowMenu } from "@/components/app/RowMenu/RowMenu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useT } from "@/features/i18n/useT";
import { queryKeys } from "@/features/library/queryStore";
import { useLibraryQuery } from "@/features/library/useLibraryQuery";
import {
  usePlaybackState,
  usePlayerCommands,
  usePlayerState,
} from "@/features/player/PlayerProvider";
import { shuffle } from "@/features/player/shuffle";
import { replacePlaylistMusics } from "@/features/playlist/playlistCommands";
import { parsePlaylistRouteId } from "@/features/playlist/routeId";
import { formatTime } from "@/libs/formatTime";
import { cn } from "@/libs/utils";
import { moveItem, removeAt } from "./reorder";

/**
 * Playlist view route (`/playlists/:playlistId?`)
 * (`docs/specs/v1.0/features/playlist.md`): header (name, counts, Play /
 * Shuffle) and the position-ordered track list — ordinal numbers, artist /
 * album columns, drag & drop reorder, and per-row removal. Every playback
 * action queues the playlist's tracks (`QueueSource: "playlist"`).
 */
export const PlaylistsPage = () => {
  const t = useT();
  const { playlistId } = useParams();
  const ref =
    playlistId !== undefined ? parsePlaylistRouteId(playlistId) : null;
  return (
    <div className="h-full">
      {playlistId === undefined ? (
        <section className="p-6">
          <p className="text-muted-foreground text-sm">
            {t("playlist.selectPrompt")}
          </p>
        </section>
      ) : ref === null ? (
        <section className="p-6">
          <p className="text-muted-foreground text-sm">
            {t("playlist.notFound")}
          </p>
        </section>
      ) : (
        <PlaylistContent key={playlistId} routeId={playlistId} />
      )}
    </div>
  );
};

/**
 * Optimistic track order pending server confirmation. Valid only while
 * `base` is still the identity the query store serves — a completed refetch
 * replaces the value and thereby retires the override, no effect needed.
 */
type PendingOrder = {
  readonly base: readonly Music[];
  readonly order: readonly Music[];
};

/** Selected-playlist content; remounted per playlist via `key` above. */
const PlaylistContent = ({ routeId }: { readonly routeId: string }) => {
  const t = useT();
  // Parse cannot fail here — the parent only mounts this for valid ids.
  const ref = parsePlaylistRouteId(routeId) as NonNullable<
    ReturnType<typeof parsePlaylistRouteId>
  >;
  const playlistsState = useLibraryQuery<readonly Playlist[]>(
    queryKeys.playlists,
  );
  const musicsState = useLibraryQuery<readonly Music[]>(
    queryKeys.musicsByPlaylist(routeId),
  );
  const commands = usePlayerCommands();
  const { current } = usePlayerState();
  const playbackState = usePlaybackState();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [pending, setPending] = useState<PendingOrder | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const playlist =
    playlistsState.status === "success"
      ? (playlistsState.value.find(
          (entry) => entry.id === ref.id && entry.kind === ref.kind,
        ) ?? null)
      : null;
  const fetched = musicsState.status === "success" ? musicsState.value : [];
  // The optimistic order only applies while it was derived from the list
  // the store still serves; a refetch retires it by identity.
  const musics =
    pending !== null && pending.base === fetched ? pending.order : fetched;
  const totalDurationMs = musics.reduce(
    (total, music) => total + music.durationMs,
    0,
  );

  const virtualizer = useVirtualizer({
    count: musics.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => MUSIC_ROW_HEIGHT,
    overscan: 12,
  });

  const playFrom = (music: Music): void => {
    void commands.playMusic(music, [...musics], "playlist");
  };

  const playAll = (): void => {
    const first = musics[0];
    if (first !== undefined) {
      playFrom(first);
    }
  };

  const playShuffled = (): void => {
    const shuffled = shuffle(musics);
    const first = shuffled[0];
    if (first !== undefined) {
      void commands.playMusic(first, shuffled, "playlist");
    }
  };

  /** Persist a new order optimistically (reorder / row removal). */
  const commitOrder = (order: readonly Music[]): void => {
    setPending({ base: fetched, order });
    void replacePlaylistMusics(ref.id, order);
  };

  const dropOn = (index: number): void => {
    if (dragIndex !== null && dragIndex !== index) {
      commitOrder(moveItem(musics, dragIndex, index));
    }

    setDragIndex(null);
    setOverIndex(null);
  };

  const playingStateOf = (music: Music): "playing" | "paused" | null => {
    if (current === null || current.id !== music.id) {
      return null;
    }

    return playbackState === "playing" ? "playing" : "paused";
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-4 border-b px-6 py-4">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-md bg-muted">
          <ListMusic aria-hidden className="size-7 text-muted-foreground" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-2 truncate font-semibold text-lg">
            {playlist?.name ?? ""}
            {ref.kind === "smart" && (
              <Badge variant="secondary">{t("playlist.smartBadge")}</Badge>
            )}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("artist.songs", { count: musics.length })}
            {" · "}
            {formatTime(totalDurationMs / 1000)}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Button size="sm" disabled={musics.length === 0} onClick={playAll}>
              <Play /> {t("player.play")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={musics.length === 0}
              onClick={playShuffled}
            >
              <ShuffleIcon /> {t("player.shuffle")}
            </Button>
          </div>
        </div>
      </header>

      {musicsState.status === "error" && (
        <p className="break-all px-6 py-3 text-destructive text-sm">
          {t("library.loadFailed", { message: musicsState.error.message })}
        </p>
      )}
      {musicsState.status === "success" && musics.length === 0 && (
        <p className="px-6 py-6 text-muted-foreground text-sm">
          {t("playlist.emptyTracks")}
        </p>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-2">
        <ul
          className="relative w-full list-none"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualizer.getVirtualItems().map((item) => {
            const music = musics[item.index];
            if (music === undefined) {
              return null;
            }

            return (
              <li
                key={item.index}
                draggable={ref.kind === "static"}
                className={cn(
                  "absolute top-0 left-0 w-full",
                  overIndex === item.index &&
                    dragIndex !== null &&
                    "border-primary border-t-2",
                )}
                style={{
                  height: item.size,
                  transform: `translateY(${item.start}px)`,
                }}
                onDragStart={() => setDragIndex(item.index)}
                onDragOver={(event) => {
                  event.preventDefault();
                  setOverIndex(item.index);
                }}
                onDrop={() => dropOn(item.index)}
                onDragEnd={() => {
                  setDragIndex(null);
                  setOverIndex(null);
                }}
              >
                <MusicRow
                  music={music}
                  ordinal={item.index + 1}
                  columns={
                    <>
                      <span className="w-1/4 shrink-0 truncate text-muted-foreground text-xs">
                        {music.artist}
                      </span>
                      <span className="w-1/4 shrink-0 truncate text-muted-foreground text-xs">
                        {music.album}
                      </span>
                    </>
                  }
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
                        ...(ref.kind === "static"
                          ? [
                              {
                                label: t("menu.removeFromPlaylist"),
                                onSelect: () =>
                                  commitOrder(removeAt(musics, item.index)),
                                destructive: true,
                                separatorBefore: true,
                              },
                            ]
                          : []),
                      ]}
                    />
                  }
                />
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
