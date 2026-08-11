import type { FilterOptions } from "@mp/ipc";
import { useSyncExternalStore } from "react";
import { queryKeys } from "@/features/library/queryStore/queryKeys";
import { useLibraryQuery } from "@/features/library/useLibraryQuery";
import { albumFilterStore } from "../albumFilterStore";
import { hasActiveFilter } from "../hasActiveFilter";

/**
 * Logic of `AlbumFilterPanel`: the draft filter, the selectable genre /
 * decade options, and the dispatch handlers. Controls only dispatch to the
 * shared filter store — the albums page reads the applied filter from the
 * same store for its query key.
 */
export const useAlbumFilterPanel = () => {
  const { draft } = useSyncExternalStore(
    albumFilterStore.subscribe,
    albumFilterStore.getSnapshot,
  );
  const optionsState = useLibraryQuery<FilterOptions>(queryKeys.filterOptions);
  const options = optionsState.status === "success" ? optionsState.value : null;

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

  const setText = (text: string): void => {
    albumFilterStore.dispatch({ type: "textChanged", text });
  };

  const toggleGenre = (genre: string): void => {
    albumFilterStore.dispatch({ type: "genreToggled", genre });
  };

  const toggleDecade = (decade: number | null): void => {
    albumFilterStore.dispatch({ type: "decadeToggled", decade });
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
    setText,
    toggleGenre,
    toggleDecade,
    clear,
  };
};
