import type { AlbumSummary } from "@mp/ipc";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { musicInfoStore } from "@/features/library/musicInfoStore";
import { queryKeys } from "@/features/library/queryStore/queryKeys";
import { useLibraryQuery } from "@/features/library/useLibraryQuery";
import { activeAlbumKeyOf } from "@/features/player/activeAlbumKeyOf";
import {
  usePlaybackState,
  usePlayerCommands,
  usePlayerState,
} from "@/features/player/PlayerProvider";
import { trackFilterStore } from "@/features/trackFilter/trackFilterStore";
import { albumFilterStore } from "./albumFilterStore";
import { buildAlbumGridRows } from "./buildAlbumGridRows";
import { computeAlbumGridLayout } from "./computeAlbumGridLayout";
import { nextAlbumKeyOf } from "./nextAlbumKeyOf";
import { sortAlbums } from "./sortAlbums";
import { useElementWidth } from "./useElementWidth";

/**
 * Logic of `PageContent`: the applied filter's album summaries, the
 * responsive grid geometry, the row virtualiser, the selection / playback
 * handlers, and the detail pane's follow after an edit moved the selected
 * album's tracks. The component only renders what this hook returns.
 */
export const usePageContent = () => {
  const { applied } = useSyncExternalStore(
    albumFilterStore.subscribe,
    albumFilterStore.getSnapshot,
  );
  const { applied: trackFilter } = useSyncExternalStore(
    trackFilterStore.subscribe,
    trackFilterStore.getSnapshot,
  );
  // The toolbar's song filter joins the sidebar filter for the query only —
  // it never enters albumFilterStore, so it is not persisted with the rest.
  const musicTitle = trackFilter.albums.trim();
  const albumsState = useLibraryQuery<readonly AlbumSummary[]>(
    queryKeys.albums(musicTitle === "" ? applied : { ...applied, musicTitle }),
  );
  const commands = usePlayerCommands();
  const { current } = usePlayerState();
  const playbackState = usePlaybackState();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  // Width comes from the inner content element, not the scroll container:
  // clientWidth of the container includes its padding, and columns computed
  // against that overflow the content box (horizontal scrollbar).
  const contentRef = useRef<HTMLDivElement | null>(null);
  const width = useElementWidth(contentRef);
  /** `albumKey` of the album shown in the detail pane; card click toggles it. */
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const albums =
    albumsState.status === "success" ? sortAlbums(albumsState.value) : [];
  const layout = computeAlbumGridLayout(width);
  const rows = buildAlbumGridRows(albums, layout.columns);
  // A selectedKey that no longer matches any album (e.g. the filter changed
  // while selected) simply closes the detail pane.
  const selectedAlbum =
    albums.find((album) => album.albumKey === selectedKey) ?? null;
  /** `albumKey` of the playing / paused track's album; lights its card up. */
  const activeAlbumKey = activeAlbumKeyOf(current, playbackState);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    // Row-identity keys: a filter or column-count change reshuffles rows —
    // identity keys keep the measured heights attached to their rows instead
    // of their positions.
    getItemKey: (index) => rows[index]?.[0]?.albumKey ?? index,
    estimateSize: () => layout.rowHeight,
    overscan: 6,
  });
  // The virtualizer's measurement cache does not watch estimateSize — when a
  // resize changes the card geometry the rows must be re-measured wholesale.
  // biome-ignore lint/correctness/useExhaustiveDependencies: layout.rowHeight is the trigger — the new value reaches the virtualizer through estimateSize, not through the effect body.
  useEffect(() => {
    virtualizer.measure();
  }, [virtualizer, layout.rowHeight]);

  // Subscription to an external event source (the dialog's apply), not a
  // state sync: when an edit changed the album key of the selected album's
  // tracks the pane follows them (`docs/specs/v1.1/features/route-follow.md`).
  // A key that vanished from the grid closes the pane through the derived
  // `selectedAlbum` above, as in v1.0.
  useEffect(
    () =>
      musicInfoStore.onApplied(({ targets, updated }) => {
        setSelectedKey((key) =>
          key === null ? null : nextAlbumKeyOf(key, targets, updated),
        );
      }),
    [],
  );

  const toggleSelected = (album: AlbumSummary): void => {
    setSelectedKey((key) => (key === album.albumKey ? null : album.albumKey));
  };

  /** Queue exactly this album and play it from the top (hover play button). */
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
    selectedAlbum,
    activeAlbumKey,
    toggleSelected,
    playAlbum,
  };
};
