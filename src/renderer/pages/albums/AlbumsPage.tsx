import type { AlbumSummary } from "@mp/ipc";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Disc3, FilterX, FolderInput, Play } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/features/i18n/useT";
import { importStore } from "@/features/import/importStore";
import { queryKeys } from "@/features/library/queryStore";
import { useLibraryQuery } from "@/features/library/useLibraryQuery";
import { usePlayerCommands } from "@/features/player/PlayerProvider";
import { toMediaFileUrl } from "@/libs/mediaUrl";
import { cn } from "@/libs/utils";
import { albumFilterStore, hasActiveFilter } from "./albumFilterStore";
import { computeAlbumGridLayout, GRID_GAP } from "./albumGridLayout";
import { AlbumDetail } from "./components/AlbumDetail/AlbumDetail";
import { buildAlbumGridRows, estimateDetailHeight } from "./gridRows";
import { sortAlbums } from "./sortAlbums";
import { useElementWidth } from "./useElementWidth";

/**
 * Album view route (`/albums`)
 * (`docs/specs/v1.0/features/album-view.md`): the filtered album summaries
 * as an artwork-first card grid, virtualised by row, with the expanded
 * album's track list spliced in as an inline full-width row — no route
 * change, so the filter state and scroll position survive expansion and
 * playback. The filter itself lives in the sidebar panel; this page only
 * reads the applied filter's query key.
 */
export const AlbumsPage = () => {
  const t = useT();
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

  return (
    <div className="flex h-full flex-col">
      {albumsState.status === "error" && (
        <p className="break-all px-6 py-3 text-destructive text-sm">
          {t("library.loadFailed", { message: albumsState.error.message })}
        </p>
      )}
      {albumsState.status === "success" && albums.length === 0 && (
        <EmptyState filtered={hasActiveFilter(applied)} />
      )}
      <div
        ref={scrollRef}
        className="flex-1 overflow-x-hidden overflow-y-auto p-6 pt-4"
      >
        <div
          ref={contentRef}
          className="relative w-full"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualizer.getVirtualItems().map((item) => {
            const row = rows[item.index];
            if (row === undefined) {
              return null;
            }

            // Rows are measured (measureElement), not fixed: the detail
            // row's height depends on its fetched track list, so content
            // defines the height and translateY positions the row.
            return (
              <div
                key={item.key}
                data-index={item.index}
                ref={virtualizer.measureElement}
                className="absolute top-0 left-0 w-full"
                style={{ transform: `translateY(${item.start}px)` }}
              >
                {row.type === "cards" ? (
                  <div className="flex pb-4" style={{ gap: GRID_GAP }}>
                    {row.albums.map((album) => (
                      <AlbumCard
                        key={album.albumKey}
                        album={album}
                        width={layout.cardWidth}
                        expanded={album.albumKey === expandedKey}
                        onToggle={() => toggleExpanded(album)}
                        onPlay={() => void playAlbum(album)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="pb-4">
                    <AlbumDetail album={row.album} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/** Empty state: no filter match vs. an entirely empty library. */
const EmptyState = ({ filtered }: { readonly filtered: boolean }) => {
  const t = useT();
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16">
      <p className="text-muted-foreground text-sm">
        {filtered ? t("album.noMatch") : t("album.empty")}
      </p>
      {filtered ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => albumFilterStore.dispatch({ type: "cleared" })}
        >
          <FilterX /> {t("album.filter.clear")}
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => void importStore.openFromDialog()}
        >
          <FolderInput /> {t("sidebar.import")}
        </Button>
      )}
    </div>
  );
};

/**
 * One album card: artwork (click = toggle the inline detail) with a hover
 * ▶ overlay, then name / artist / year.
 */
const AlbumCard = ({
  album,
  width,
  expanded,
  onToggle,
  onPlay,
}: {
  readonly album: AlbumSummary;
  readonly width: number;
  readonly expanded: boolean;
  readonly onToggle: () => void;
  readonly onPlay: () => void;
}) => {
  const t = useT();
  return (
    <div className="group shrink-0" style={{ width }}>
      <div className="relative">
        <button
          type="button"
          aria-expanded={expanded}
          aria-label={album.album}
          className={cn(
            "block w-full overflow-hidden rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            expanded && "ring-2 ring-primary",
          )}
          onClick={onToggle}
        >
          {album.picturePath !== null ? (
            <img
              src={toMediaFileUrl(album.picturePath)}
              alt=""
              loading="lazy"
              className="aspect-square w-full bg-muted object-cover"
            />
          ) : (
            <span className="flex aspect-square w-full items-center justify-center bg-muted">
              <Disc3 aria-hidden className="size-10 text-muted-foreground" />
            </span>
          )}
        </button>
        <button
          type="button"
          aria-label={`${t("player.play")}: ${album.album}`}
          className="absolute right-2 bottom-2 flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-md transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
          onClick={onPlay}
        >
          <Play className="size-4" />
        </button>
      </div>
      <p className="truncate pt-2 font-medium text-sm" title={album.album}>
        {album.album}
      </p>
      <p className="truncate text-muted-foreground text-xs">{album.artist}</p>
      <p className="text-muted-foreground text-xs tabular-nums">
        {album.year !== null ? album.year : "—"}
      </p>
    </div>
  );
};
