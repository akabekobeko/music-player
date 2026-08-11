import { HStack, Stack } from "@/components/app/stacks";
import { useT } from "@/features/i18n/useT";
import { AlbumCard } from "./AlbumCard";
import { AlbumDetail } from "./AlbumDetail/AlbumDetail";
import { GRID_GAP } from "./computeAlbumGridLayout";
import { EmptyState } from "./EmptyState";
import { hasActiveFilter } from "./hasActiveFilter";
import { usePageContent } from "./usePageContent";

/**
 * Album view content (`/albums`)
 * (`docs/specs/v1.0/features/album-view.md`): the filtered album summaries
 * as an artwork-first card grid, virtualised by row, with the expanded
 * album's track list spliced in as an inline full-width row — no route
 * change, so the filter state and scroll position survive expansion and
 * playback. The filter itself lives in the sidebar panel; this page only
 * reads the applied filter's query key.
 */
export const PageContent = () => {
  const t = useT();
  const {
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
  } = usePageContent();

  return (
    <Stack className="h-full gap-0">
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
                  <HStack
                    className="items-stretch pb-4"
                    style={{ gap: GRID_GAP }}
                  >
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
                  </HStack>
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
    </Stack>
  );
};
