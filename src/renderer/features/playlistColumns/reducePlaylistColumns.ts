import { DEFAULT_PLAYLIST_COLUMNS_STATE, PLAYLIST_COLUMNS } from "./constants";
import type { PlaylistColumnId, PlaylistColumnsState } from "./types";

/** Store actions; reduced by the pure {@link reducePlaylistColumns}. */
export type PlaylistColumnsAction =
  | {
      readonly type: "visibilityChanged";
      readonly columnId: PlaylistColumnId;
      readonly visible: boolean;
    }
  | {
      readonly type: "widthChanged";
      readonly columnId: PlaylistColumnId;
      readonly width: number;
    }
  | { readonly type: "widthReset"; readonly columnId: PlaylistColumnId }
  | { readonly type: "reset" };

/**
 * Reduce one action onto the column layout
 * (`docs/specs/v1.3/architecture/column-settings.md`). Pure; the store owns
 * the side effects (persistence, notification).
 *
 * - `visibilityChanged` shows or hides an optional column. Pinned columns
 *   are ignored, and hiding keeps the column's saved width.
 * - `widthChanged` saves a resized width in px. Columns that cannot be
 *   resized are ignored, and a width equal to the column's default drops
 *   the saved width instead, so "resized back to the default" and "never
 *   resized" are the same state.
 * - `widthReset` drops a saved width, returning the column to its default.
 * - `reset` returns to `DEFAULT_PLAYLIST_COLUMNS_STATE`.
 *
 * @param state - Current column layout.
 * @param action - Action to apply.
 * @returns The next layout; the same object when the action changes
 *   nothing, so the store can skip the save and the notification.
 */
export const reducePlaylistColumns = (
  state: PlaylistColumnsState,
  action: PlaylistColumnsAction,
): PlaylistColumnsState => {
  if (action.type === "reset") {
    return DEFAULT_PLAYLIST_COLUMNS_STATE;
  }

  const column = PLAYLIST_COLUMNS.find((entry) => entry.id === action.columnId);
  if (column === undefined) {
    return state;
  }

  /** The layout without a saved width for the column. */
  const withoutWidth = (): PlaylistColumnsState => {
    if (!(column.id in state.widths)) {
      return state;
    }

    const { [column.id]: _, ...widths } = state.widths;
    return { ...state, widths };
  };

  switch (action.type) {
    case "visibilityChanged": {
      if (
        column.pinned ||
        state.visibleIds.includes(column.id) === action.visible
      ) {
        return state;
      }

      return {
        ...state,
        visibleIds: action.visible
          ? [...state.visibleIds, column.id]
          : state.visibleIds.filter((id) => id !== column.id),
      };
    }
    case "widthChanged": {
      if (!column.resizable || state.widths[column.id] === action.width) {
        return state;
      }

      return action.width === column.width
        ? withoutWidth()
        : { ...state, widths: { ...state.widths, [column.id]: action.width } };
    }
    case "widthReset":
      return withoutWidth();
  }
};
