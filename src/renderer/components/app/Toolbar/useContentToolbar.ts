import { useSyncExternalStore } from "react";
import { useLocation } from "react-router";
import { sectionOf } from "@/features/layout/sectionOf";
import { sidebarStore } from "@/features/layout/sidebarStore";
import { PLAYLIST_COLUMNS } from "@/features/playlistColumns/constants";
import { isDefaultPlaylistColumns } from "@/features/playlistColumns/isDefaultPlaylistColumns";
import { playlistColumnsStore } from "@/features/playlistColumns/playlistColumnsStore";
import type { PlaylistColumnId } from "@/features/playlistColumns/types";
import { trackFilterStore } from "@/features/trackFilter/trackFilterStore";
import type { ColumnsMenuItem } from "./ColumnsMenu";

/**
 * Logic of `ContentToolbar`: the sidebar snapshot (the icon cluster moves
 * here while the sidebar is closed), the song filter of the active
 * route's section — its draft text and the change handler — or `null`
 * when the route has no track list, and the columns menu of the Playlist
 * table — its entries and the toggle / reset handlers — or `null` outside
 * the Playlists section. The menu shows whether or not a playlist is
 * selected, so the toolbar layout does not shift with the selection.
 */
export const useContentToolbar = () => {
  const sidebar = useSyncExternalStore(
    sidebarStore.subscribe,
    sidebarStore.getSnapshot,
  );
  const { draft } = useSyncExternalStore(
    trackFilterStore.subscribe,
    trackFilterStore.getSnapshot,
  );
  const columnsState = useSyncExternalStore(
    playlistColumnsStore.subscribe,
    playlistColumnsStore.getSnapshot,
  );
  const { pathname } = useLocation();
  const section = sectionOf(pathname);

  const filter =
    section === null
      ? null
      : {
          text: draft[section],
          setText: (text: string): void => {
            trackFilterStore.setText(section, text);
          },
        };

  const columns =
    section !== "playlists"
      ? null
      : {
          items: PLAYLIST_COLUMNS.flatMap((column): ColumnsMenuItem[] =>
            column.pinned || column.labelKey === null
              ? []
              : [
                  {
                    id: column.id,
                    labelKey: column.labelKey,
                    visible: columnsState.visibleIds.includes(column.id),
                  },
                ],
          ),
          resettable: !isDefaultPlaylistColumns(columnsState),
          toggle: (columnId: PlaylistColumnId, visible: boolean): void => {
            playlistColumnsStore.dispatch({
              type: "visibilityChanged",
              columnId,
              visible,
            });
          },
          reset: (): void => {
            playlistColumnsStore.dispatch({ type: "reset" });
          },
        };

  return { sidebar, filter, columns };
};
