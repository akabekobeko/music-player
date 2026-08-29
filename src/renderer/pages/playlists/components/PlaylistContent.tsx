import { ListEnd, ListStart, ListX, NotepadText } from "lucide-react";
import { AddToPlaylistSubmenu } from "@/components/app/AddToPlaylistSubmenu/AddToPlaylistSubmenu";
import { EllipsisText } from "@/components/app/EllipsisText/EllipsisText";
import { PlayFillIcon } from "@/components/app/Icons/PlayFillIcon";
import { MusicRow } from "@/components/app/MusicList/MusicList";
import { RowMenu } from "@/components/app/RowMenu/RowMenu";
import { Stack } from "@/components/app/stacks";
import { useT } from "@/features/i18n/useT";
import { musicInfoStore } from "@/features/library/musicInfoStore";
import { cn } from "@/libs/utils";
import { PlaylistHeader } from "./PlaylistHeader";
import { SmartRulesDialog } from "./SmartRulesDialog/SmartRulesDialog";
import { usePlaylistContent } from "./usePlaylistContent";

type Props = {
  readonly routeId: string;
};

/** Selected-playlist content; remounted per playlist via the parent's `key`. */
export const PlaylistContent = ({ routeId }: Props) => {
  const t = useT();
  const {
    ref,
    playlist,
    rows,
    musicsState,
    filterActive,
    totalDurationMs,
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

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-2">
        <ul
          className="relative w-full list-none"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualizer.getVirtualItems().map((item) => {
            const row = rows[item.index];
            if (row === undefined) {
              return null;
            }

            const music = row.music;
            return (
              <li
                key={item.index}
                draggable={ref.kind === "static" && !filterActive}
                className={cn(
                  "absolute top-0 left-0 w-full",
                  overIndex === item.index &&
                    dragIndex !== null &&
                    "border-primary border-t-2",
                )}
                style={{
                  height: item.size,
                  transform: `translateY(${item.start}px)`,
                }}
                onDragStart={() => startDrag(item.index)}
                onDragOver={(event) => {
                  event.preventDefault();
                  dragOver(item.index);
                }}
                onDrop={() => dropOn(item.index)}
                onDragEnd={endDrag}
              >
                <MusicRow
                  music={music}
                  ordinal={row.index + 1}
                  columns={
                    <>
                      <EllipsisText
                        className="w-1/4 shrink-0 text-muted-foreground text-xs"
                        text={music.artist}
                      />
                      <EllipsisText
                        className="w-1/4 shrink-0 text-muted-foreground text-xs"
                        text={music.album}
                      />
                    </>
                  }
                  playing={playingStateOf(music)}
                  onPlay={() => playFrom(music)}
                  menu={
                    <RowMenu
                      items={[
                        {
                          label: t("player.play"),
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
                          musics={[music]}
                        />,
                        {
                          label: t("menu.musicInfo"),
                          icon: <NotepadText />,
                          onSelect: () => musicInfoStore.open(music),
                          separatorBefore: true,
                        },
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
                  }
                />
              </li>
            );
          })}
        </ul>
      </div>
    </Stack>
  );
};
