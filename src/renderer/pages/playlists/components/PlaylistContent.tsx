import { ListMusic, Pencil, Play, Shuffle as ShuffleIcon } from "lucide-react";
import { AddToPlaylistSubmenu } from "@/components/app/AddToPlaylistSubmenu/AddToPlaylistSubmenu";
import { MusicRow } from "@/components/app/MusicList/MusicList";
import { RowMenu } from "@/components/app/RowMenu/RowMenu";
import { HStack, Stack, VStack } from "@/components/app/stacks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useT } from "@/features/i18n/useT";
import { formatTime } from "@/libs/formatTime";
import { cn } from "@/libs/utils";
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
    musics,
    musicsState,
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
      <header className="flex items-center gap-4 border-b px-6 py-4">
        <VStack className="size-16 shrink-0 rounded-md bg-muted">
          <ListMusic aria-hidden className="size-7 text-muted-foreground" />
        </VStack>
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-2 truncate font-semibold text-lg">
            {playlist?.name ?? ""}
            {ref.kind === "smart" && (
              <Badge variant="secondary">{t("playlist.smartBadge")}</Badge>
            )}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("artist.songs", { count: musics.length })}
            {" · "}
            {formatTime(totalDurationMs / 1000)}
          </p>
          <HStack className="mt-2">
            <Button size="sm" disabled={musics.length === 0} onClick={playAll}>
              <Play /> {t("player.play")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={musics.length === 0}
              onClick={playShuffled}
            >
              <ShuffleIcon /> {t("player.shuffle")}
            </Button>
            {ref.kind === "smart" && (
              <Button size="sm" variant="outline" onClick={openRulesEditor}>
                <Pencil /> {t("smart.editRules")}
              </Button>
            )}
          </HStack>
        </div>
      </header>

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
      {musicsState.status === "success" && musics.length === 0 && (
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
            const music = musics[item.index];
            if (music === undefined) {
              return null;
            }

            return (
              <li
                key={item.index}
                draggable={ref.kind === "static"}
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
                  ordinal={item.index + 1}
                  columns={
                    <>
                      <span className="w-1/4 shrink-0 truncate text-muted-foreground text-xs">
                        {music.artist}
                      </span>
                      <span className="w-1/4 shrink-0 truncate text-muted-foreground text-xs">
                        {music.album}
                      </span>
                    </>
                  }
                  playing={playingStateOf(music)}
                  onPlay={() => playFrom(music)}
                  menu={
                    <RowMenu
                      items={[
                        {
                          label: t("player.play"),
                          onSelect: () => playFrom(music),
                        },
                        {
                          label: t("menu.playNext"),
                          onSelect: () => commands.insertNext([music]),
                        },
                        {
                          label: t("menu.addToQueue"),
                          onSelect: () => commands.appendToQueue([music]),
                        },
                        <AddToPlaylistSubmenu
                          key="playlist"
                          musics={[music]}
                        />,
                        ...(ref.kind === "static"
                          ? [
                              {
                                label: t("menu.removeFromPlaylist"),
                                onSelect: () => removeRowAt(item.index),
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
