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
    rows,
    musicsState,
    filterActive,
    reorderable,
    totalDurationMs,
    columns,
    widthOf,
    tableWidth,
    measured,
    sort,
    sortBy,
    resize,
    minWidthOf,
    resetWidth,
    scrollRef,
    virtualizer,
    commands,
    dragIndex,
    overIndex,
    startDrag,
    dragOver,
    dropOn,
    endDrag,
    editingRules,
    openRulesEditor,
    closeRulesEditor,
    submitRules,
    playFrom,
    playAll,
    playShuffled,
    removeRowAt,
    selection,
    selectRow,
    menuTargetsOfRow,
    openMusicInfo,
    playingStateOf,
  } = usePlaylistContent(routeId);

  return (
    <Stack className="h-full gap-0">
      <PlaylistHeader
        name={playlist?.name ?? ""}
        smart={ref.kind === "smart"}
        musics={rows.map((row) => row.music)}
        totalDurationMs={totalDurationMs}
        onPlayAll={playAll}
        onPlayShuffled={playShuffled}
        onEditRules={openRulesEditor}
      />

      {editingRules && playlist !== null && (
        <SmartRulesDialog
          title={t("smart.editRules")}
          initialRules={playlist.rules}
          onClose={closeRulesEditor}
          onSubmit={(rules) => submitRules(rules)}
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
        ref={scrollRef}
        className="flex-1 overflow-auto"
        style={{ paddingInline: PLAYLIST_TABLE_PADDING_X }}
      >
        {measured && (
          <PlaylistTable width={tableWidth}>
            <PlaylistTableHeader
              columns={columns}
              widthOf={widthOf}
              sort={sort}
              onSort={sortBy}
              resize={resize}
              minWidthOf={minWidthOf}
              onResetWidth={resetWidth}
            />
            <PlaylistTableBody height={virtualizer.getTotalSize()}>
              {virtualizer.getVirtualItems().map((item) => {
                const row = rows[item.index];
                if (row === undefined) {
                  return null;
                }

                const music = row.music;
                return (
                  <PlaylistTableRow
                    key={item.index}
                    columns={columns}
                    widthOf={widthOf}
                    music={music}
                    ordinal={row.index + 1}
                    // `start` counts from the scroll container's top, the
                    // row from the body's, which begins below the header.
                    offset={item.start - virtualizer.options.scrollMargin}
                    locale={locale}
                    playing={playingStateOf(music)}
                    selected={selection.selectedIds.has(row.index)}
                    draggable={reorderable}
                    dropTarget={overIndex === item.index && dragIndex !== null}
                    onSelect={(event) => {
                      selectRow(row.index, {
                        shift: event.shiftKey,
                        meta: event.metaKey || event.ctrlKey,
                      });
                    }}
                    onPlay={() => playFrom(music)}
                    onTogglePlayPause={() => commands.togglePlayPause()}
                    onDragStart={() => startDrag(item.index)}
                    onDragOver={() => dragOver(item.index)}
                    onDrop={() => dropOn(item.index)}
                    onDragEnd={endDrag}
                    menuItems={[
                      {
                        label: t("menu.playMusic"),
                        icon: <PlayFillIcon />,
                        onSelect: () => playFrom(music),
                      },
                      {
                        label: t("menu.playNext"),
                        icon: <ListStart />,
                        onSelect: () => commands.insertNext([music]),
                      },
                      {
                        label: t("menu.addToQueue"),
                        icon: <ListEnd />,
                        onSelect: () => commands.appendToQueue([music]),
                      },
                      <AddToPlaylistSubmenu
                        key="playlist"
                        musics={menuTargetsOfRow(row)}
                      />,
                      {
                        label: t("menu.musicInfo"),
                        icon: <NotepadText />,
                        onSelect: () => openMusicInfo(row),
                        separatorBefore: true,
                      },
                      fetchMusicInfoItem(menuTargetsOfRow(row)),
                      ...(ref.kind === "static"
                        ? [
                            {
                              label: t("menu.removeFromPlaylist"),
                              icon: <ListX />,
                              onSelect: () => removeRowAt(row.index),
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
