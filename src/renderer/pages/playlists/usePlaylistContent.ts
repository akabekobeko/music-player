import type { Music, Playlist, SmartPlaylistRules } from "@mp/ipc";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, useState } from "react";
import { MUSIC_ROW_HEIGHT } from "@/components/app/MusicList/MusicList";
import { queryKeys } from "@/features/library/queryStore";
import { useLibraryQuery } from "@/features/library/useLibraryQuery";
import {
  usePlaybackState,
  usePlayerCommands,
  usePlayerState,
} from "@/features/player/PlayerProvider";
import { shuffle } from "@/features/player/shuffle";
import {
  replacePlaylistMusics,
  updatePlaylist,
} from "@/features/playlist/playlistCommands";
import { parsePlaylistRouteId } from "@/features/playlist/routeId";
import { moveItem, removeAt } from "./reorder";

/**
 * Optimistic track order pending server confirmation. Valid only while
 * `base` is still the identity the query store serves — a completed refetch
 * replaces the value and thereby retires the override, no effect needed.
 */
type PendingOrder = {
  readonly base: readonly Music[];
  readonly order: readonly Music[];
};

/**
 * Logic of `PlaylistContent`: the playlist and its position-ordered tracks
 * (with the optimistic reorder override), the row virtualiser, drag & drop
 * reorder, the smart-rules editor state, and every playback action. The
 * component only renders what this hook returns.
 */
export const usePlaylistContent = (routeId: string) => {
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
  /** Whether the smart-rules editor is open (smart playlists only). */
  const [editingRules, setEditingRules] = useState(false);

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

  /** Remove the row at `index` (static playlists only). */
  const removeRowAt = (index: number): void => {
    commitOrder(removeAt(musics, index));
  };

  const startDrag = (index: number): void => {
    setDragIndex(index);
  };

  const dragOver = (index: number): void => {
    setOverIndex(index);
  };

  const dropOn = (index: number): void => {
    if (dragIndex !== null && dragIndex !== index) {
      commitOrder(moveItem(musics, dragIndex, index));
    }

    setDragIndex(null);
    setOverIndex(null);
  };

  const endDrag = (): void => {
    setDragIndex(null);
    setOverIndex(null);
  };

  const openRulesEditor = (): void => {
    setEditingRules(true);
  };

  const closeRulesEditor = (): void => {
    setEditingRules(false);
  };

  /** Persist edited smart-playlist rules and close the editor. */
  const submitRules = (rules: SmartPlaylistRules): void => {
    setEditingRules(false);
    void updatePlaylist({ id: ref.id, kind: "smart", rules });
  };

  const playingStateOf = (music: Music): "playing" | "paused" | null => {
    if (current === null || current.id !== music.id) {
      return null;
    }

    return playbackState === "playing" ? "playing" : "paused";
  };

  return {
    ref,
    playlist,
    musics,
    musicsState,
    totalDurationMs,
    scrollRef,
    virtualizer,
    commands,
    dragIndex,
    overIndex,
    startDrag,
    dragOver,
    dropOn,
    endDrag,
    editingRules,
    openRulesEditor,
    closeRulesEditor,
    submitRules,
    playFrom,
    playAll,
    playShuffled,
    removeRowAt,
    playingStateOf,
  };
};
