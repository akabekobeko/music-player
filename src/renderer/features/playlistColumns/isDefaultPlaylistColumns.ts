import { DEFAULT_PLAYLIST_COLUMNS_STATE } from "./constants";
import type { PlaylistColumnsState } from "./types";

/**
 * Whether the column layout equals the defaults, i.e. "Reset columns" would
 * change nothing: no resized width, and the same set of visible columns
 * whatever their order in the list.
 *
 * @param state - Current column layout.
 * @returns `true` when the layout is the default one.
 */
export const isDefaultPlaylistColumns = (
  state: PlaylistColumnsState,
): boolean => {
  const defaults = DEFAULT_PLAYLIST_COLUMNS_STATE.visibleIds;
  return (
    Object.keys(state.widths).length === 0 &&
    state.visibleIds.length === defaults.length &&
    defaults.every((id) => state.visibleIds.includes(id))
  );
};
