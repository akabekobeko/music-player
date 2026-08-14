import { Disc3, Play, Shuffle as ShuffleIcon, UserRound } from "lucide-react";
import { AddToPlaylistSubmenu } from "@/components/app/AddToPlaylistSubmenu/AddToPlaylistSubmenu";
import { EllipsisText } from "@/components/app/EllipsisText/EllipsisText";
import { MusicRow } from "@/components/app/MusicList/MusicList";
import { RowMenu } from "@/components/app/RowMenu/RowMenu";
import { HStack, Stack, VStack } from "@/components/app/stacks";
import { Button } from "@/components/ui/button";
import { useT } from "@/features/i18n/useT";
import { artistEditStore } from "@/features/library/artistEditStore";
import { formatTime } from "@/libs/formatTime";
import { toMediaFileUrl } from "@/libs/toMediaFileUrl";
import { useArtistContent } from "./useArtistContent";

type Props = {
  readonly artistName: string;
};

/** Selected-artist content; remounted per artist via the parent's `key`. */
export const ArtistContent = ({ artistName }: Props) => {
  const t = useT();
  const {
    artist,
    musics,
    musicsState,
    groups,
    rows,
    playOrder,
    selection,
    selectRow,
    scrollRef,
    virtualizer,
    commands,
    playAll,
    playShuffled,
    playFrom,
    playAlbum,
    albumMusicsOf,
    playlistTargetsOf,
    removeFromLibrary,
    playingStateOf,
  } = useArtistContent(artistName);

  return (
    <Stack className="h-full gap-0">
      <header className="flex items-center gap-4 border-b px-6 py-4">
        {artist?.picturePath != null ? (
          <img
            src={toMediaFileUrl(artist.picturePath)}
            alt=""
            className="size-16 shrink-0 rounded-full object-cover"
          />
        ) : (
          <VStack className="size-16 shrink-0 rounded-full bg-muted">
            <UserRound aria-hidden className="size-7 text-muted-foreground" />
          </VStack>
        )}
        <Stack className="min-w-0 flex-1">
          <div>
            <h1 className="font-semibold text-lg">
              <EllipsisText text={artistName} />
            </h1>
            <p className="text-muted-foreground text-sm">
              {t("artist.albumCount", { count: groups.length })}
              {" · "}
              {t("artist.songs", { count: musics.length })}
            </p>
          </div>
          <HStack>
            <Button
              size="sm"
              disabled={playOrder.length === 0}
              onClick={playAll}
            >
              <Play /> {t("player.play")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={playOrder.length === 0}
              onClick={playShuffled}
            >
              <ShuffleIcon /> {t("player.shuffle")}
            </Button>
          </HStack>
        </Stack>
        <span className="self-start">
          <RowMenu
            items={[
              { label: t("player.play"), onSelect: playAll },
              { label: t("player.shuffle"), onSelect: playShuffled },
              <AddToPlaylistSubmenu key="playlist" musics={playOrder} />,
              {
                label: t("artistEdit.menu"),
                onSelect: () =>
                  artistEditStore.open({
                    name: artistName,
                    picturePath: artist?.picturePath ?? null,
                  }),
                separatorBefore: true,
              },
            ]}
          />
        </span>
      </header>

      {musicsState.status === "error" && (
        <p className="break-all px-6 py-3 text-destructive text-sm">
          {t("library.loadFailed", { message: musicsState.error.message })}
        </p>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6">
        <div
          className="relative w-full"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualizer.getVirtualItems().map((item) => {
            const row = rows[item.index];
            if (row === undefined) {
              return null;
            }

            return (
              <div
                key={
                  row.type === "album"
                    ? `album:${row.group.key}`
                    : row.type === "disc"
                      ? `disc:${row.albumKey}:${row.disc}`
                      : `music:${row.music.id}`
                }
                className="absolute top-0 left-0 w-full"
                style={{
                  height: item.size,
                  transform: `translateY(${item.start}px)`,
                }}
              >
                {row.type === "album" && (
                  <HStack className="items-end gap-4 pt-6 pb-2">
                    {row.group.picturePath !== null ? (
                      <img
                        src={toMediaFileUrl(row.group.picturePath)}
                        alt=""
                        className="size-28 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <VStack className="size-28 shrink-0 rounded-md bg-muted">
                        <Disc3
                          aria-hidden
                          className="size-10 text-muted-foreground"
                        />
                      </VStack>
                    )}
                    <div className="min-w-0 flex-1 pb-1">
                      <h2 className="font-medium text-base">
                        <EllipsisText text={row.group.album} />
                      </h2>
                      <EllipsisText
                        className="text-muted-foreground text-xs"
                        text={[
                          row.group.year !== null
                            ? String(row.group.year)
                            : null,
                          row.group.genre !== "" ? row.group.genre : null,
                          t("artist.songs", { count: row.group.musicCount }),
                          formatTime(row.group.totalDurationMs / 1000),
                        ]
                          .filter((part) => part !== null)
                          .join(" · ")}
                      />
                    </div>
                    <RowMenu
                      items={[
                        {
                          label: t("player.play"),
                          onSelect: () => playAlbum(row.group),
                        },
                        {
                          label: t("menu.addToQueue"),
                          onSelect: () =>
                            commands.appendToQueue(albumMusicsOf(row.group)),
                        },
                        <AddToPlaylistSubmenu
                          key="playlist"
                          musics={albumMusicsOf(row.group)}
                        />,
                      ]}
                    />
                  </HStack>
                )}
                {row.type === "disc" && (
                  <p className="flex h-8 items-end px-2 font-medium text-muted-foreground text-xs">
                    {t("album.disc", { number: row.disc })}
                  </p>
                )}
                {row.type === "music" && (
                  <MusicRow
                    music={row.music}
                    playing={playingStateOf(row.music)}
                    selected={selection.selectedIds.has(row.music.id)}
                    onClick={(event) => {
                      selectRow(row.music.id, {
                        shift: event.shiftKey,
                        meta: event.metaKey || event.ctrlKey,
                      });
                    }}
                    onPlay={() => playFrom(row.music)}
                    menu={
                      <RowMenu
                        items={[
                          {
                            label: t("player.play"),
                            onSelect: () => playFrom(row.music),
                          },
                          {
                            label: t("menu.playNext"),
                            onSelect: () => commands.insertNext([row.music]),
                          },
                          {
                            label: t("menu.addToQueue"),
                            onSelect: () => commands.appendToQueue([row.music]),
                          },
                          <AddToPlaylistSubmenu
                            key="playlist"
                            musics={playlistTargetsOf(row.music)}
                          />,
                          {
                            label: t("menu.removeFromLibrary"),
                            onSelect: () => removeFromLibrary(row.music),
                            destructive: true,
                            separatorBefore: true,
                          },
                        ]}
                      />
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Stack>
  );
};
