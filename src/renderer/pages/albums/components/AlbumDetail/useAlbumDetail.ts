import type { Music } from "@mp/ipc";
import { useState, useSyncExternalStore } from "react";
import { queryKeys } from "@/features/library/queryStore/queryKeys";
import {
  applySelectionClick,
  EMPTY_SELECTION,
  type SelectionState,
} from "@/features/library/selection/applySelectionClick";
import { menuTargetsOf } from "@/features/library/selection/menuTargetsOf";
import { useLibraryQuery } from "@/features/library/useLibraryQuery";
import {
  usePlaybackState,
  usePlayerCommands,
  usePlayerState,
} from "@/features/player/PlayerProvider";
import {
  type RowPlayingState,
  rowPlayingStateOf,
} from "@/features/player/rowPlayingStateOf";
import { matchesTrackFilter } from "@/features/trackFilter/matchesTrackFilter";
import { trackFilterStore } from "@/features/trackFilter/trackFilterStore";

/**
 * Multi-selection bound to the track list it was made on. Valid only while
 * `base` is still the identity the query store serves — switching the album
 * or a refetch replaces the value and thereby clears the selection, no
 * effect needed (`docs/specs/v1.1/features/selection.md`).
 */
type BoundSelection = {
  readonly base: readonly Music[];
  readonly selection: SelectionState;
};

/**
 * Logic of `AlbumDetail`: the album's tracks, the disc split, the
 * multi-selection, and every playback / library action — each queues
 * **only this album's tracks**. The component only renders what this hook
 * returns.
 */
export const useAlbumDetail = (albumKey: string) => {
  const musicsState = useLibraryQuery<readonly Music[]>(
    queryKeys.musicsByAlbum(albumKey),
  );
  const commands = usePlayerCommands();
  const { current } = usePlayerState();
  const playbackState = usePlaybackState();
  const [bound, setBound] = useState<BoundSelection | null>(null);

  const { applied: trackFilter } = useSyncExternalStore(
    trackFilterStore.subscribe,
    trackFilterStore.getSnapshot,
  );

  // The toolbar's song filter narrows the track list to match the grid,
  // which the same text filters through SQL (`AlbumFilter.musicTitle`).
  const fetched = musicsState.status === "success" ? musicsState.value : [];
  const musics = fetched.filter((music) =>
    matchesTrackFilter(music.title, trackFilter.albums),
  );
  const discNumbers = [...new Set(musics.map((music) => music.disc))];
  const selection =
    bound !== null && bound.base === fetched
      ? bound.selection
      : EMPTY_SELECTION;

  /** Apply one row click (plain / Shift / Cmd-Ctrl) to the selection. */
  const selectRow = (
    musicId: number,
    modifiers: { readonly shift: boolean; readonly meta: boolean },
  ): void => {
    setBound({
      base: fetched,
      selection: applySelectionClick(
        selection,
        musics.map((music) => music.id),
        musicId,
        modifiers,
      ),
    });
  };

  /**
   * Tracks a row's menu actions ("Add to playlist", "Song info") apply to:
   * the whole multi-selection (in list order) when the row is part of it,
   * otherwise the row alone.
   */
  const menuTargetsOfRow = (music: Music): readonly Music[] =>
    menuTargetsOf(selection, musics, (entry) => entry.id, music);

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

  const playingStateOf = (music: Music): RowPlayingState =>
    rowPlayingStateOf(current, playbackState, music);

  return {
    musics,
    musicsState,
    discNumbers,
    selection,
    selectRow,
    menuTargetsOfRow,
    commands,
    playFrom,
    playAll,
    removeFromLibrary,
    playingStateOf,
  };
};
