import type { AlbumFilter } from "@mp/ipc";
import { toggle } from "./toggle";

/** Store actions; reduced by the pure {@link reduceAlbumFilter}. */
export type AlbumFilterAction =
  | { readonly type: "textChanged"; readonly text: string }
  | { readonly type: "genreToggled"; readonly genre: string }
  | { readonly type: "genresReplaced"; readonly genres: readonly string[] }
  | { readonly type: "decadeToggled"; readonly decade: number | null }
  | {
      readonly type: "decadesReplaced";
      readonly decades: readonly (number | null)[];
    }
  | { readonly type: "cleared" };

/**
 * Reduce one action onto a filter
 * (`docs/specs/v1.0/features/album-view.md`). Pure — the store owns the side
 * effects (debounce, persistence, notification).
 *
 * @param filter - Current draft filter.
 * @param action - Action to apply.
 * @returns The next filter; inactive fields are dropped rather than kept
 *   empty, so "no filter" is always the empty object.
 */
export const reduceAlbumFilter = (
  filter: AlbumFilter,
  action: AlbumFilterAction,
): AlbumFilter => {
  switch (action.type) {
    case "textChanged": {
      const { text: _, ...rest } = filter;
      return action.text !== "" ? { ...rest, text: action.text } : rest;
    }
    case "genreToggled": {
      const { genres: _, ...rest } = filter;
      const genres = toggle(filter.genres ?? [], action.genre);
      return genres.length > 0 ? { ...rest, genres } : rest;
    }
    case "genresReplaced": {
      const { genres: _, ...rest } = filter;
      return action.genres.length > 0
        ? { ...rest, genres: action.genres }
        : rest;
    }
    case "decadeToggled": {
      const { decades: _, ...rest } = filter;
      const decades = toggle(filter.decades ?? [], action.decade);
      return decades.length > 0 ? { ...rest, decades } : rest;
    }
    case "decadesReplaced": {
      const { decades: _, ...rest } = filter;
      return action.decades.length > 0
        ? { ...rest, decades: action.decades }
        : rest;
    }
    case "cleared":
      return {};
  }
};
