import { useMemo, useRef, useState } from "react";
import { useMatch } from "react-router";
import { compareNameWithoutArticle } from "@/features/library/compareNameWithoutArticle/compareNameWithoutArticle";
import { useArtists } from "@/features/library/useArtists";
import { ARTIST_NAME_PATTERN, UNKNOWN_ARTIST_PATH } from "../../artistPath";
import { groupArtistsByInitial } from "./groupArtistsByInitial";
import type { Initial } from "./initials";
import type { ArtistListRowsHandle } from "./useArtistListRows";

/**
 * Logic of `ArtistListPanel`: route-driven selection, the text filter, the
 * filtered + article-blind sorted artists grouped into initial sections, and
 * the bridge from the initial picker to the rows' scroll.
 */
export const useArtistListPanel = () => {
  // The Sidebar lives in the layout route, whose context does not carry the
  // child route's params — match the patterns against the location instead.
  const artistName = useMatch(ARTIST_NAME_PATTERN)?.params.artistName;
  const unknownSelected = useMatch(UNKNOWN_ARTIST_PATH) !== null;
  const artistsState = useArtists();
  const [query, setQuery] = useState("");
  const rowsRef = useRef<ArtistListRowsHandle | null>(null);

  // Filter + sort + group are derived — never copied into state. Memoised so
  // the rows only rebuild their virtualiser layout when the inputs change.
  const sections = useMemo(
    () =>
      artistsState.status === "success"
        ? groupArtistsByInitial(
            artistsState.value
              .filter((artist) =>
                artist.name.toLowerCase().includes(query.trim().toLowerCase()),
              )
              .toSorted((a, b) => compareNameWithoutArticle(a.name, b.name)),
          )
        : [],
    [artistsState, query],
  );
  const availableInitials = useMemo(
    () => new Set<Initial>(sections.map((section) => section.initial)),
    [sections],
  );

  return {
    artistsState,
    sections,
    availableInitials,
    selectedName: unknownSelected ? "" : artistName,
    query,
    setQuery,
    rowsRef,
    jumpToInitial: (initial: Initial) => {
      rowsRef.current?.scrollToInitial(initial);
    },
  };
};
