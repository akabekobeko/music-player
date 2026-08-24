import type { Ref } from "react";
import { ArtistRow } from "./ArtistRow";
import type { ArtistSection } from "./groupArtistsByInitial";
import { InitialHeading } from "./InitialHeading";
import {
  type ArtistListRowsHandle,
  useArtistListRows,
} from "./useArtistListRows";

type Props = {
  /** Filtered + sorted artists, grouped by initial. */
  readonly sections: readonly ArtistSection[];
  /** Selected artist name from the route (`""` = unknown bucket). */
  readonly selectedName: string | undefined;
  /** Receives `scrollToInitial` for the panel's initial picker. */
  readonly ref: Ref<ArtistListRowsHandle>;
};

/**
 * Virtualised rows of `ArtistListPanel`: initial headings and artist rows,
 * plus a pinned copy of the current section's heading at the top of the
 * scroll area (UITableView-style — translucent so the rows sliding under it
 * stay visible; it lands exactly over the in-list heading when that heading
 * is at the top, and the next heading takes over once it reaches the top).
 * Rendered only once the artist list has loaded so the virtualiser's
 * `initialOffset` can bring the selected artist into view at mount — a
 * restored selection (launch, tab switch) is visible without scrolling.
 */
export const ArtistListRows = ({ sections, selectedName, ref }: Props) => {
  const { scrollRef, items, virtualizer, activeInitial, onScroll } =
    useArtistListRows({ sections, selectedName, ref });

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto" onScroll={onScroll}>
      {activeInitial !== null && (
        <div className="sticky top-0 z-10 h-0">
          <InitialHeading
            initial={activeInitial}
            className="absolute inset-x-0 top-0 bg-muted/75 backdrop-blur-sm"
          />
        </div>
      )}
      <div
        className="relative w-full"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualizer.getVirtualItems().map((row) => {
          const item = items[row.index];
          if (item === undefined) {
            return null;
          }

          return item.kind === "heading" ? (
            <InitialHeading
              key={row.key}
              initial={item.initial}
              className="absolute top-0 left-0"
              style={{ transform: `translateY(${row.start}px)` }}
            />
          ) : (
            <ArtistRow
              key={row.key}
              artist={item.artist}
              selected={item.artist.name === selectedName}
              top={row.start}
              height={row.size}
            />
          );
        })}
      </div>
    </div>
  );
};
