import type { Music, Playlist, SmartPlaylistRules } from "@mp/ipc";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { MUSIC_ROW_HEIGHT } from "@/components/app/MusicRow/MusicRow";
import { useElementWidth } from "@/features/layout/useElementWidth";
import { musicInfoStore } from "@/features/library/musicInfoStore";
import { queryKeys } from "@/features/library/queryStore/queryKeys";
import {
  applySelectionClick,
  EMPTY_SELECTION,
  type SelectionState,
} from "@/features/library/selection/applySelectionClick";
import { menuTargetsOf } from "@/features/library/selection/menuTargetsOf";
import { uniqueMusics } from "@/features/library/selection/uniqueMusics";
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
import { parsePlaylistRouteId } from "@/features/playlist/parsePlaylistRouteId";
import { replacePlaylistMusics } from "@/features/playlist/playlistCommands/replacePlaylistMusics";
import { updatePlaylist } from "@/features/playlist/playlistCommands/updatePlaylist";
import { PLAYLIST_COLUMNS } from "@/features/playlistColumns/constants";
import { fitTitleWidth } from "@/features/playlistColumns/fitTitleWidth";
import { minResizeWidthOf } from "@/features/playlistColumns/minResizeWidthOf";
import { playlistColumnsStore } from "@/features/playlistColumns/playlistColumnsStore";
import { resolveColumnWidths } from "@/features/playlistColumns/resolveColumnWidths";
import { resolveVisibleColumns } from "@/features/playlistColumns/resolveVisibleColumns";
import type { PlaylistColumnId } from "@/features/playlistColumns/types";
import { matchesTrackFilter } from "@/features/trackFilter/matchesTrackFilter";
import { trackFilterStore } from "@/features/trackFilter/trackFilterStore";
import { moveItem } from "./moveItem";
import { comparePlaylistRows } from "./PlaylistTable/comparePlaylistRows/comparePlaylistRows";
import {
  PLAYLIST_TABLE_HEADER_HEIGHT,
  PLAYLIST_TABLE_PADDING_X,
  PLAYLIST_TABLE_PADDING_Y,
} from "./PlaylistTable/constants";
import { nextPlaylistSort } from "./PlaylistTable/nextPlaylistSort";
import {
  DEFAULT_PLAYLIST_SORT,
  type PlaylistRow,
  type PlaylistSort,
} from "./PlaylistTable/types";
import { useColumnResize } from "./PlaylistTable/useColumnResize/useColumnResize";
import { removeAt } from "./removeAt";

/**
 * Optimistic track order pending server confirmation. Valid only while
 * `base` is still the identity the query store serves — a completed refetch
 * replaces the value and thereby retires the override, no effect needed.
 */
type PendingOrder = {
  /** The query store value the order was derived from (identity check). */
  readonly base: readonly Music[];
  /** The reordered tracks, shown until a refetch replaces `base`. */
  readonly order: readonly Music[];
};

/**
 * Multi-selection of rows (positions, since one track may sit on several
 * rows) bound to the order it was made on. Valid only while `base` is still
 * the list on display — a reorder, a refetch, or the switch to another
 * playlist replaces the value and thereby clears the selection, no effect
 * needed (`docs/specs/v1.1/features/selection.md`).
 */
type BoundSelection = {
  /** The displayed order the selection was made on (identity check). */
  readonly base: readonly Music[];
  /** Selected row positions and the Shift anchor (`applySelectionClick`). */
  readonly selection: SelectionState;
};

/**
 * Logic of `PlaylistContent`: the playlist and its position-ordered tracks
 * (with the optimistic reorder override), the table's columns with their
 * displayed widths and the resize drag, the sort state, the row
 * virtualiser, the row multi-selection, drag & drop reorder, the
 * smart-rules editor state, and every playback action. The component only
 * renders what this hook returns: the playlist and its rows at the top
 * level, everything else grouped by role.
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
  const [bound, setBound] = useState<BoundSelection | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  /** Whether the smart-rules editor is open (smart playlists only). */
  const [editingRules, setEditingRules] = useState(false);
  /**
   * Sort of this playlist. Not persisted: the component remounts per
   * playlist, so every playlist opens in the playlist order.
   */
  const [sortState, setSortState] = useState<PlaylistSort>(
    DEFAULT_PLAYLIST_SORT,
  );

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

  // Columns and widths are derived in render from the store's layout
  // (`docs/specs/v1.3/architecture/column-settings.md`): resolved widths,
  // then the width of a resize drag in flight, then the title column taking
  // up whatever the container has left.
  const columnsState = useSyncExternalStore(
    playlistColumnsStore.subscribe,
    playlistColumnsStore.getSnapshot,
  );
  const columns = resolveVisibleColumns(
    PLAYLIST_COLUMNS,
    columnsState.visibleIds,
  );
  const { liveWidths, handlers: resizeHandlers } = useColumnResize({
    baseWidths: resolveColumnWidths(columns, columnsState.widths),
    onColumnResize: (columnId, width) => {
      playlistColumnsStore.dispatch({ type: "widthChanged", columnId, width });
    },
  });
  const scrollWidth = useElementWidth(scrollRef);
  // The table waits for the first measurement, so the columns never jump
  // from the default widths to the fitted ones.
  const measured = scrollWidth > 0;
  const containerWidth = Math.max(
    0,
    scrollWidth - PLAYLIST_TABLE_PADDING_X * 2,
  );
  const widths = fitTitleWidth(liveWidths, containerWidth);
  /** Displayed width in px of a column, for the header and the cells. */
  const widthOf = (columnId: PlaylistColumnId): number => widths[columnId] ?? 0;
  /** Lower bound in px for a resize drag of a column. */
  const minWidthOf = (columnId: PlaylistColumnId): number =>
    minResizeWidthOf(columnId, widths, containerWidth);
  const tableWidth = columns.reduce(
    (total, column) => total + widthOf(column.id),
    0,
  );

  /** Return a column to its default width (resize handle double-click). */
  const resetWidth = (columnId: PlaylistColumnId): void => {
    playlistColumnsStore.dispatch({ type: "widthReset", columnId });
  };

  // Hiding the sorted column returns to the playlist order. The state is
  // adjusted while rendering, so showing the column again does not bring
  // the sort back.
  const sortVisible = columns.some(
    (column) => column.id === sortState.columnId,
  );
  if (!sortVisible) {
    setSortState(DEFAULT_PLAYLIST_SORT);
  }

  const sort = sortVisible ? sortState : DEFAULT_PLAYLIST_SORT;
  const playlistOrder =
    sort.columnId === DEFAULT_PLAYLIST_SORT.columnId &&
    sort.order === DEFAULT_PLAYLIST_SORT.order;

  /** A column header was clicked: sort by it, or flip the direction. */
  const sortBy = (columnId: PlaylistColumnId): void => {
    setSortState(nextPlaylistSort(sort, columnId));
  };

  const { applied: trackFilter } = useSyncExternalStore(
    trackFilterStore.subscribe,
    trackFilterStore.getSnapshot,
  );
  const filterActive = trackFilter.playlists.trim() !== "";
  // The toolbar's song filter narrows what the table shows and plays, and
  // the sort orders what is left; playback, Shift ranges, and the song info
  // dialog all follow this displayed order. Rows carry their position in
  // the playlist order because the ordinal, the selection, and mutations
  // (removal) address the playlist itself, not the displayed view.
  //
  // Memoised on measurement: sorting 10,000 rows by a name column takes
  // about 16ms, a whole frame, and this hook re-renders on every pointer
  // move of a column resize drag.
  const filterText = trackFilter.playlists;
  const rows = useMemo((): readonly PlaylistRow[] => {
    const filtered = musics
      .map((music, index) => ({ music, index }))
      .filter(({ music }) => matchesTrackFilter(music.title, filterText));
    return playlistOrder
      ? filtered
      : filtered.toSorted(comparePlaylistRows(sort));
  }, [musics, filterText, sort, playlistOrder]);
  const visibleMusics = rows.map(({ music }) => music);
  const selection =
    bound !== null && bound.base === musics ? bound.selection : EMPTY_SELECTION;
  const totalDurationMs = visibleMusics.reduce(
    (total, music) => total + music.durationMs,
    0,
  );

  // Reorder needs the displayed order to be the playlist order: drag
  // indices are positions only while nothing is filtered out or sorted.
  const reorderable = ref.kind === "static" && !filterActive && playlistOrder;

  // The fixed header sits above the rows inside the scroll container, so
  // the rows start `scrollMargin` below its top; `scrollPaddingStart` keeps
  // a row scrolled into view clear of the header.
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => MUSIC_ROW_HEIGHT,
    overscan: 12,
    scrollMargin: PLAYLIST_TABLE_HEADER_HEIGHT,
    scrollPaddingStart: PLAYLIST_TABLE_HEADER_HEIGHT,
    paddingStart: PLAYLIST_TABLE_PADDING_Y,
    paddingEnd: PLAYLIST_TABLE_PADDING_Y,
  });

  const playFrom = (music: Music): void => {
    void commands.playMusic(music, visibleMusics, "playlist");
  };

  /** Apply one row click (plain / Shift / Cmd-Ctrl) to the row selection. */
  const selectRow = (
    index: number,
    modifiers: { readonly shift: boolean; readonly meta: boolean },
  ): void => {
    setBound({
      base: musics,
      selection: applySelectionClick(
        selection,
        rows.map((row) => row.index),
        index,
        modifiers,
      ),
    });
  };

  /**
   * Tracks a row's menu actions ("Add to playlist", "Song info") apply to:
   * the whole row selection (in list order, each track once) when the row
   * is part of it, otherwise the row's track alone.
   */
  const menuTargetsOfRow = (row: PlaylistRow): readonly Music[] =>
    uniqueMusics(
      menuTargetsOf(selection, rows, (entry) => entry.index, row).map(
        (entry) => entry.music,
      ),
    );

  /**
   * Menu "Song info": the row's targets, with the shown rows' tracks as the
   * list the dialog's header arrows step through (a single track only; the
   * store counts a repeated track once).
   */
  const openMusicInfo = (row: PlaylistRow): void => {
    musicInfoStore.open(menuTargetsOfRow(row), visibleMusics);
  };

  const playAll = (): void => {
    const first = visibleMusics[0];
    if (first !== undefined) {
      playFrom(first);
    }
  };

  const playShuffled = (): void => {
    void commands.playShuffled(visibleMusics, "playlist");
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
    if (dragIndex !== null && dragIndex !== index && reorderable) {
      commitOrder(moveItem(musics, dragIndex, index));
    }

    setDragIndex(null);
    setOverIndex(null);
  };

  const endDrag = (): void => {
    setDragIndex(null);
    setOverIndex(null);
  };

  /** Whether a dragged row would be inserted before the row at `index`. */
  const isDropTarget = (index: number): boolean =>
    dragIndex !== null && overIndex === index;

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

  const playingStateOf = (music: Music): RowPlayingState =>
    rowPlayingStateOf(current, playbackState, music);

  return {
    ref,
    playlist,
    musicsState,
    rows,
    filterActive,
    totalDurationMs,
    /** Table layout: columns, displayed widths, and the virtualised scroll. */
    table: {
      columns,
      widthOf,
      width: tableWidth,
      measured,
      scrollRef,
      virtualizer,
    },
    /** Sort state and the header click that changes it. */
    sort: { state: sort, sortBy },
    /** Column resize: the handles' pointer handlers, bound, and reset. */
    resize: { handlers: resizeHandlers, minWidthOf, resetWidth },
    /** Row multi-selection by playlist position. */
    selection: { selectedIds: selection.selectedIds, select: selectRow },
    /** Drag & drop reorder of a static playlist. */
    reorder: {
      enabled: reorderable,
      isDropTarget,
      start: startDrag,
      over: dragOver,
      drop: dropOn,
      end: endDrag,
    },
    /** Playback of the displayed tracks and the rows' playing state. */
    playback: {
      commands,
      stateOf: playingStateOf,
      playFrom,
      playAll,
      playShuffled,
    },
    /** Row menu: the tracks an entry applies to and the menu's actions. */
    menu: { targetsOf: menuTargetsOfRow, openMusicInfo, removeRowAt },
    /** Smart-rules editor dialog (smart playlists only). */
    rulesEditor: {
      open: editingRules,
      show: openRulesEditor,
      close: closeRulesEditor,
      submit: submitRules,
    },
  };
};
