import type { AlbumSummary } from "@mp/ipc";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Disc3, FilterX, FolderInput, Play } from "lucide-react";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/features/i18n/useT";
import { importStore } from "@/features/import/importStore";
import { queryKeys } from "@/features/library/queryStore";
import { useLibraryQuery } from "@/features/library/useLibraryQuery";
import { usePlayerCommands } from "@/features/player/PlayerProvider";
import { toMediaFileUrl } from "@/libs/mediaUrl";
import { albumFilterStore, hasActiveFilter } from "./albumFilterStore";
import { computeAlbumGridLayout, GRID_GAP } from "./albumGridLayout";
import { sortAlbums } from "./sortAlbums";
import { useElementWidth } from "./useElementWidth";

/**
 * Album view route (`/albums`)
 * (`docs/specs/v1.0/features/album-view.md`): the filtered album summaries
 * as an artwork-first card grid, virtualised by row. The filter itself lives
 * in the sidebar panel; this page only reads the applied filter's query key.
 * Card click (inline expansion) arrives with #47.
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
  const width = useElementWidth(scrollRef);

  const albums =
    albumsState.status === "success" ? sortAlbums(albumsState.value) : [];
  const layout = computeAlbumGridLayout(width);
  const rowCount = Math.ceil(albums.length / layout.columns);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => layout.rowHeight,
    overscan: 6,
  });
  // The virtualizer's measurement cache does not watch estimateSize — after
  // a resize changes the row height it must be re-measured explicitly.
  // biome-ignore lint/correctness/useExhaustiveDependencies: layout.rowHeight is the trigger — the new value reaches the virtualizer through estimateSize, not through the effect body.
  useEffect(() => {
    virtualizer.measure();
  }, [virtualizer, layout.rowHeight]);

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
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 pt-4">
        <div
          className="relative w-full"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualizer.getVirtualItems().map((item) => {
            const rowAlbums = albums.slice(
              item.index * layout.columns,
              (item.index + 1) * layout.columns,
            );
            return (
              <div
                key={item.key}
                className="absolute top-0 left-0 flex w-full"
                style={{
                  height: item.size,
                  transform: `translateY(${item.start}px)`,
                  gap: GRID_GAP,
                }}
              >
                {rowAlbums.map((album) => (
                  <AlbumCard
                    key={album.albumKey}
                    album={album}
                    width={layout.cardWidth}
                    onPlay={() => void playAlbum(album)}
                  />
                ))}
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

/** One album card: artwork with a hover ▶ overlay + name / artist / year. */
const AlbumCard = ({
  album,
  width,
  onPlay,
}: {
  readonly album: AlbumSummary;
  readonly width: number;
  readonly onPlay: () => void;
}) => {
  const t = useT();
  return (
    <div className="group shrink-0" style={{ width }}>
      <div className="relative">
        {album.picturePath !== null ? (
          <img
            src={toMediaFileUrl(album.picturePath)}
            alt=""
            loading="lazy"
            className="aspect-square w-full rounded-md bg-muted object-cover"
          />
        ) : (
          <span className="flex aspect-square w-full items-center justify-center rounded-md bg-muted">
            <Disc3 aria-hidden className="size-10 text-muted-foreground" />
          </span>
        )}
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
