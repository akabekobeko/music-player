import { ListEnd, ListStart, ListX, NotepadText } from "lucide-react";
import { AddToPlaylistSubmenu } from "@/components/app/AddToPlaylistSubmenu/AddToPlaylistSubmenu";
import { PlayFillIcon } from "@/components/app/Icons/PlayFillIcon";
import { useFetchMusicInfoItem } from "@/components/app/RowMenu/useFetchMusicInfoItem";
import { Stack } from "@/components/app/stacks";
import { useLocale } from "@/features/i18n/useLocale";
import { useT } from "@/features/i18n/useT";
import { PlaylistHeader } from "./PlaylistHeader";
import { PLAYLIST_TABLE_PADDING_X } from "./PlaylistTable/constants";
import { PlaylistTable } from "./PlaylistTable/PlaylistTable";
import { PlaylistTableBody } from "./PlaylistTable/PlaylistTableBody";
import { PlaylistTableHeader } from "./PlaylistTable/PlaylistTableHeader";
import { PlaylistTableRow } from "./PlaylistTable/PlaylistTableRow";
import { SmartRulesDialog } from "./SmartRulesDialog/SmartRulesDialog";
import { usePlaylistContent } from "./usePlaylistContent";

type Props = {
  /** Route id, `p<id>` (static) or `s<id>` (smart); the parent validates it. */
  readonly routeId: string;
};

/**
 * Selected-playlist content; remounted per playlist via the parent's `key`.
 * The tracks show as a table with a fixed header row
 * (`docs/specs/v1.3/features/playlist-table.md`). Rows multi-select like
 * the Artist view (click / Shift / Cmd-Ctrl) by position, and the row menus
 * ([...] and right-click) act on the selection.
 */
export const PlaylistContent = ({ routeId }: Props) => {
  const t = useT();
  const locale = useLocale();
  const fetchMusicInfoItem = useFetchMusicInfoItem();
  const {
    ref,
    playlist,
    musicsState,
    rows,
    filterActive,
    totalDurationMs,
    table,
    sort,
    resize,
    selection,
    reorder,
    playback,
    menu,
    rulesEditor,
  } = usePlaylistContent(routeId);

  return (
    <Stack className="h-full gap-0">
      <PlaylistHeader
        name={playlist?.name ?? ""}
        smart={ref.kind === "smart"}
        musics={rows.map((row) => row.music)}
        totalDurationMs={totalDurationMs}
        onPlayAll={playback.playAll}
        onPlayShuffled={playback.playShuffled}
        onEditRules={rulesEditor.show}
      />

      {rulesEditor.open && playlist !== null && (
        <SmartRulesDialog
          title={t("smart.editRules")}
          initialRules={playlist.rules}
          onClose={rulesEditor.close}
          onSubmit={(rules) => rulesEditor.submit(rules)}
        />
      )}

      {musicsState.status === "error" && (
        <p className="break-all px-6 py-3 text-destructive text-sm">
          {t("library.loadFailed", { message: musicsState.error.message })}
        </p>
      )}
      {musicsState.status === "success" &&
        rows.length === 0 &&
        !filterActive && (
          <p className="px-6 py-6 text-muted-foreground text-sm">
            {t("playlist.emptyTracks")}
          </p>
        )}

      <div
        ref={table.scrollRef}
        className="flex-1 overflow-auto"
        style={{ paddingInline: PLAYLIST_TABLE_PADDING_X }}
      >
        {table.measured && (
          <PlaylistTable width={table.width}>
            <PlaylistTableHeader
              columns={table.columns}
              widthOf={table.widthOf}
              sort={sort.state}
              onSort={sort.sortBy}
              resize={resize.handlers}
              minWidthOf={resize.minWidthOf}
              onResetWidth={resize.resetWidth}
            />
            <PlaylistTableBody height={table.virtualizer.getTotalSize()}>
              {table.virtualizer.getVirtualItems().map((item) => {
                const row = rows[item.index];
                if (row === undefined) {
                  return null;
                }

                const music = row.music;
                return (
                  <PlaylistTableRow
                    key={item.index}
                    columns={table.columns}
                    widthOf={table.widthOf}
                    music={music}
                    ordinal={row.index + 1}
                    // `start` counts from the scroll container's top, the
                    // row from the body's, which begins below the header.
                    offset={item.start - table.virtualizer.options.scrollMargin}
                    locale={locale}
                    playing={playback.stateOf(music)}
                    selected={selection.selectedIds.has(row.index)}
                    draggable={reorder.enabled}
                    dropTarget={reorder.isDropTarget(item.index)}
                    onSelect={(event) => {
                      selection.select(row.index, {
                        shift: event.shiftKey,
                        meta: event.metaKey || event.ctrlKey,
                      });
                    }}
                    onPlay={() => playback.playFrom(music)}
                    onTogglePlayPause={() =>
                      playback.commands.togglePlayPause()
                    }
                    onDragStart={() => reorder.start(item.index)}
                    onDragOver={() => reorder.over(item.index)}
                    onDrop={() => reorder.drop(item.index)}
                    onDragEnd={reorder.end}
                    menuItems={[
                      {
                        label: t("menu.playMusic"),
                        icon: <PlayFillIcon />,
                        onSelect: () => playback.playFrom(music),
                      },
                      {
                        label: t("menu.playNext"),
                        icon: <ListStart />,
                        onSelect: () => playback.commands.insertNext([music]),
                      },
                      {
                        label: t("menu.addToQueue"),
                        icon: <ListEnd />,
                        onSelect: () =>
                          playback.commands.appendToQueue([music]),
                      },
                      <AddToPlaylistSubmenu
                        key="playlist"
                        musics={menu.targetsOf(row)}
                      />,
                      {
                        label: t("menu.musicInfo"),
                        icon: <NotepadText />,
                        onSelect: () => menu.openMusicInfo(row),
                        separatorBefore: true,
                      },
                      fetchMusicInfoItem(menu.targetsOf(row)),
                      ...(ref.kind === "static"
                        ? [
                            {
                              label: t("menu.removeFromPlaylist"),
                              icon: <ListX />,
                              onSelect: () => menu.removeRowAt(row.index),
                              destructive: true,
                              separatorBefore: true,
                            },
                          ]
                        : []),
                    ]}
                  />
                );
              })}
            </PlaylistTableBody>
          </PlaylistTable>
        )}
      </div>
    </Stack>
  );
};
