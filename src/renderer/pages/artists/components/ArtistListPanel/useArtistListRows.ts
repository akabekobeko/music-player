import { useVirtualizer } from "@tanstack/react-virtual";
import {
  type Ref,
  type UIEvent,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { activeInitialAt } from "./activeInitialAt";
import { type ArtistListItem, flattenSections } from "./flattenSections";
import type { ArtistSection } from "./groupArtistsByInitial";
import type { Initial } from "./initials";
import { ARTIST_ROW_HEIGHT, itemHeightOf } from "./itemHeightOf";
import { itemStartsOf } from "./itemStartsOf";

/** Rows kept above the selected artist when the list mounts. */
const ROWS_ABOVE_SELECTED = 2;

/** Imperative surface of the rows, driven by the panel's initial picker. */
export type ArtistListRowsHandle = {
  /** Scrolls so the heading of `initial` sits at the top of the list. */
  readonly scrollToInitial: (initial: Initial) => void;
};

type Params = {
  readonly sections: readonly ArtistSection[];
  readonly selectedName: string | undefined;
  readonly ref: Ref<ArtistListRowsHandle>;
};

/** Stable virtualiser key of a row — also drives measurement invalidation. */
const keyOf = (item: ArtistListItem): string =>
  item.kind === "heading"
    ? `heading:${item.initial}`
    : `artist:${item.artist.name}`;

/**
 * Logic of `ArtistListRows`: flattens the sections into virtualised rows of
 * two fixed heights, restores the selected artist into view at mount, tracks
 * which heading is pinned for the current scroll offset, and exposes
 * `scrollToInitial` through `ref`.
 */
export const useArtistListRows = ({ sections, selectedName, ref }: Params) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const items = useMemo(() => flattenSections(sections), [sections]);
  const starts = useMemo(() => itemStartsOf(items), [items]);

  const selectedIndex =
    selectedName !== undefined
      ? items.findIndex(
          (item) => item.kind === "artist" && item.artist.name === selectedName,
        )
      : -1;
  const initialOffset =
    selectedIndex < 0
      ? 0
      : Math.max(
          0,
          (starts[selectedIndex] ?? 0) -
            ROWS_ABOVE_SELECTED * ARTIST_ROW_HEIGHT,
        );

  // A new `getItemKey` identity whenever the rows change makes the
  // virtualiser rebuild its measurements synchronously with the fresh
  // `estimateSize` — the row kinds at an index may differ after filtering
  // even when the count is unchanged.
  const getItemKey = useMemo(
    () => (index: number) => {
      const item = items[index];
      return item === undefined ? index : keyOf(item);
    },
    [items],
  );
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => {
      const item = items[index];
      return item === undefined ? ARTIST_ROW_HEIGHT : itemHeightOf(item);
    },
    getItemKey,
    overscan: 10,
    initialOffset,
  });

  // The virtualiser only re-renders when the visible range changes, so the
  // pinned heading tracks the raw scroll offset itself. Re-derived when the
  // rows change (filter / library update) because the offset may now fall in
  // a different section.
  const [activeInitial, setActiveInitial] = useState<Initial | null>(() =>
    activeInitialAt(items, starts, initialOffset),
  );
  useEffect(() => {
    setActiveInitial(
      activeInitialAt(items, starts, scrollRef.current?.scrollTop ?? 0),
    );
  }, [items, starts]);
  const onScroll = (event: UIEvent<HTMLDivElement>) => {
    setActiveInitial(
      activeInitialAt(items, starts, event.currentTarget.scrollTop),
    );
  };

  useImperativeHandle(
    ref,
    () => ({
      scrollToInitial: (initial) => {
        const index = items.findIndex(
          (item) => item.kind === "heading" && item.initial === initial,
        );
        if (index >= 0) {
          virtualizer.scrollToIndex(index, { align: "start" });
        }
      },
    }),
    [items, virtualizer],
  );

  return { scrollRef, items, virtualizer, activeInitial, onScroll };
};
