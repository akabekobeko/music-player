import type { FilterOptions } from "@mp/ipc";
import { useState, useSyncExternalStore } from "react";
import { queryKeys } from "@/features/library/queryStore/queryKeys";
import { useLibraryQuery } from "@/features/library/useLibraryQuery";
import { albumFilterStore } from "../albumFilterStore";
import { hasActiveFilter } from "../hasActiveFilter";

/** Accordion section values, in display order. */
const SECTIONS = ["genre", "decade"] as const;

/**
 * Logic of `AlbumFilterPanel`: the draft filter, the selectable genre /
 * decade options, the accordion open state, and the dispatch handlers.
 * Controls only dispatch to the shared filter store — the albums page reads
 * the applied filter from the same store for its query key. The accordion
 * open state is view-local (sections open independently; the header button
 * expands / collapses all at once).
 */
export const useAlbumFilterPanel = () => {
  const { draft } = useSyncExternalStore(
    albumFilterStore.subscribe,
    albumFilterStore.getSnapshot,
  );
  const optionsState = useLibraryQuery<FilterOptions>(queryKeys.filterOptions);
  const options = optionsState.status === "success" ? optionsState.value : null;
  const [openSections, setOpenSections] = useState<string[]>([...SECTIONS]);

  // Persisted genres that no longer exist in the library (e.g. after a
  // remove) stay visible as checked zero-count items instead of filtering
  // invisibly.
  const selectedGenres = draft.genres ?? [];
  const genres = [
    ...(options?.genres ?? []),
    ...selectedGenres
      .filter((name) => !options?.genres.some((genre) => genre.name === name))
      .map((name) => ({ name, count: 0 })),
  ];
  const decades = draft.decades ?? [];
  // The unknown-year marker (`null`) is a fixed choice appended after the
  // library-derived decades.
  const decadeChoices: readonly (number | null)[] = [
    ...(options?.decades ?? []),
    null,
  ];

  const allOpen = SECTIONS.every((section) => openSections.includes(section));
  const allGenresSelected =
    genres.length > 0 &&
    genres.every((genre) => selectedGenres.includes(genre.name));
  const allDecadesSelected = decadeChoices.every((decade) =>
    decades.includes(decade),
  );

  const toggleAllOpen = (): void => {
    setOpenSections(allOpen ? [] : [...SECTIONS]);
  };

  const setText = (text: string): void => {
    albumFilterStore.dispatch({ type: "textChanged", text });
  };

  const toggleGenre = (genre: string): void => {
    albumFilterStore.dispatch({ type: "genreToggled", genre });
  };

  const toggleAllGenres = (): void => {
    albumFilterStore.dispatch({
      type: "genresReplaced",
      genres: allGenresSelected ? [] : genres.map((genre) => genre.name),
    });
  };

  const toggleDecade = (decade: number | null): void => {
    albumFilterStore.dispatch({ type: "decadeToggled", decade });
  };

  const toggleAllDecades = (): void => {
    albumFilterStore.dispatch({
      type: "decadesReplaced",
      decades: allDecadesSelected ? [] : decadeChoices,
    });
  };

  const clear = (): void => {
    albumFilterStore.dispatch({ type: "cleared" });
  };

  const canClear = hasActiveFilter(draft);

  return {
    draft,
    optionsState,
    options,
    selectedGenres,
    genres,
    decades,
    canClear,
    openSections,
    setOpenSections,
    allOpen,
    allGenresSelected,
    allDecadesSelected,
    toggleAllOpen,
    setText,
    toggleGenre,
    toggleAllGenres,
    toggleDecade,
    toggleAllDecades,
    clear,
  };
};
