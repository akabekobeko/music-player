import { HStack, Stack } from "@/components/app/stacks";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
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
 * as an artwork-first card grid, virtualised by row. Selecting a card
 * toggles the album's track list in a resizable bottom pane — no route
 * change, so the filter state and scroll position survive selection and
 * playback, and the grid and the track list scroll independently. The
 * filter itself lives in the sidebar panel; this page only reads the
 * applied filter's query key.
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
    selectedAlbum,
    toggleSelected,
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
      <ResizablePanelGroup orientation="vertical" className="min-h-0 flex-1">
        <ResizablePanel className="min-h-0" minSize="25">
          <div
            ref={scrollRef}
            className="h-full overflow-x-hidden overflow-y-auto p-6 pt-4"
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

                // Rows are measured (measureElement), not fixed: content
                // defines the height and translateY positions the row.
                return (
                  <div
                    key={item.key}
                    data-index={item.index}
                    ref={virtualizer.measureElement}
                    className="absolute top-0 left-0 w-full"
                    style={{ transform: `translateY(${item.start}px)` }}
                  >
                    <HStack
                      className="items-stretch pb-4"
                      style={{ gap: GRID_GAP }}
                    >
                      {row.map((album) => (
                        <AlbumCard
                          key={album.albumKey}
                          album={album}
                          width={layout.cardWidth}
                          expanded={album.albumKey === selectedAlbum?.albumKey}
                          onToggle={() => toggleSelected(album)}
                          onPlay={() => void playAlbum(album)}
                        />
                      ))}
                    </HStack>
                  </div>
                );
              })}
            </div>
          </div>
        </ResizablePanel>
        {selectedAlbum !== null && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel className="min-h-0" defaultSize="40" minSize="15">
              <div className="h-full overflow-x-hidden overflow-y-auto px-6 py-4">
                <AlbumDetail album={selectedAlbum} />
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </Stack>
  );
};
