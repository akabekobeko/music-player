import type { Music } from "@mp/ipc";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, useState } from "react";
import { flattenAlbumMusics } from "@/features/library/flattenAlbumMusics";
import { groupAlbums } from "@/features/library/groupAlbums/groupAlbums";
import type { AlbumGroup } from "@/features/library/groupAlbums/types";
import { useArtistMusics } from "@/features/library/useArtistMusics";
import { useArtists } from "@/features/library/useArtists";
import {
  usePlaybackState,
  usePlayerCommands,
  usePlayerState,
} from "@/features/player/PlayerProvider";
import { shuffle } from "@/features/player/shuffle";
import {
  applySelectionClick,
  EMPTY_SELECTION,
  type SelectionState,
} from "./applySelectionClick";
import { ALBUM_ROW_HEIGHTS, buildAlbumRows } from "./buildAlbumRows";

/**
 * Logic of `ArtistContent`: the artist's albums / play order, the row
 * virtualiser, the multi-selection, and every playback / library action.
 * The component only renders what this hook returns.
 */
export const useArtistContent = (artistName: string) => {
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

  /**
   * Tracks a row's "Add to playlist" targets: the whole multi-selection (in
   * play order) when the row is part of it, otherwise the row alone.
   */
  const playlistTargetsOf = (music: Music): Music[] =>
    selection.selectedIds.has(music.id) && selection.selectedIds.size > 1
      ? playOrder.filter((entry) => selection.selectedIds.has(entry.id))
      : [music];

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

  /** Apply one row click (plain / Shift / Cmd-Ctrl) to the selection. */
  const selectRow = (
    musicId: number,
    modifiers: { readonly shift: boolean; readonly meta: boolean },
  ): void => {
    setSelection(
      applySelectionClick(selection, orderedIds, musicId, modifiers),
    );
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

  return {
    artist,
    musics,
    musicsState,
    groups,
    rows,
    playOrder,
    selection,
    selectRow,
    scrollRef,
    virtualizer,
    commands,
    playAll,
    playShuffled,
    playFrom,
    playAlbum,
    albumMusicsOf,
    playlistTargetsOf,
    removeFromLibrary,
    playingStateOf,
  };
};
