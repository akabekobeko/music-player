import type { AlbumSummary } from "@mp/ipc";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { queryKeys } from "@/features/library/queryStore";
import { useLibraryQuery } from "@/features/library/useLibraryQuery";
import { usePlayerCommands } from "@/features/player/PlayerProvider";
import { albumFilterStore } from "./albumFilterStore";
import { computeAlbumGridLayout } from "./albumGridLayout";
import { buildAlbumGridRows, estimateDetailHeight } from "./gridRows";
import { sortAlbums } from "./sortAlbums";
import { useElementWidth } from "./useElementWidth";

/**
 * Logic of `AlbumsPage`: the applied filter's album summaries, the
 * responsive grid geometry, the row virtualiser, and the expansion /
 * playback handlers. The component only renders what this hook returns.
 */
export const useAlbumsPage = () => {
  const { applied } = useSyncExternalStore(
    albumFilterStore.subscribe,
    albumFilterStore.getSnapshot,
  );
  const albumsState = useLibraryQuery<readonly AlbumSummary[]>(
    queryKeys.albums(applied),
  );
  const commands = usePlayerCommands();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  // Width comes from the inner content element, not the scroll container:
  // clientWidth of the container includes its padding, and columns computed
  // against that overflow the content box (horizontal scrollbar).
  const contentRef = useRef<HTMLDivElement | null>(null);
  const width = useElementWidth(contentRef);
  /** `albumKey` of the inline-expanded album; card click toggles it. */
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const albums =
    albumsState.status === "success" ? sortAlbums(albumsState.value) : [];
  const layout = computeAlbumGridLayout(width);
  const rows = buildAlbumGridRows(albums, layout.columns, expandedKey);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    // Row-identity keys: expansion inserts a row and shifts every index
    // after it — identity keys keep the measured heights attached to their
    // rows instead of their positions.
    getItemKey: (index) => {
      const row = rows[index];
      return row === undefined
        ? index
        : row.type === "cards"
          ? `cards:${row.albums[0]?.albumKey ?? index}`
          : `detail:${row.album.albumKey}`;
    },
    estimateSize: (index) => {
      const row = rows[index];
      return row === undefined || row.type === "cards"
        ? layout.rowHeight
        : estimateDetailHeight(row.album);
    },
    overscan: 6,
  });
  // The virtualizer's measurement cache does not watch estimateSize — when a
  // resize changes the card geometry the rows must be re-measured wholesale.
  // (The detail row's own height changes are covered by measureElement.)
  // biome-ignore lint/correctness/useExhaustiveDependencies: layout.rowHeight is the trigger — the new value reaches the virtualizer through estimateSize, not through the effect body.
  useEffect(() => {
    virtualizer.measure();
  }, [virtualizer, layout.rowHeight]);

  const toggleExpanded = (album: AlbumSummary): void => {
    setExpandedKey((key) => (key === album.albumKey ? null : album.albumKey));
  };

  /** Queue exactly this album and play it from the top (hover ▶). */
  const playAlbum = async (album: AlbumSummary): Promise<void> => {
    const result = await window.mp.library.getMusicsByAlbum({
      albumKey: album.albumKey,
    });
    if (!result.ok) {
      console.error("Failed to load album tracks", result.error);
      return;
    }

    const first = result.value[0];
    if (first !== undefined) {
      void commands.playMusic(first, [...result.value], "album");
    }
  };

  return {
    applied,
    albumsState,
    albums,
    layout,
    rows,
    scrollRef,
    contentRef,
    virtualizer,
    expandedKey,
    toggleExpanded,
    playAlbum,
  };
};
