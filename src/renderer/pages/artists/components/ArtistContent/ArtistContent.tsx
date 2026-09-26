import { Stack } from "@/components/app/stacks";
import { useT } from "@/features/i18n/useT";
import { cn } from "@/libs/utils";
import { AlbumHeaderRow } from "./AlbumHeaderRow";
import { ArtistHeader } from "./ArtistHeader";
import { ArtistMusicRow } from "./ArtistMusicRow";
import { useArtistContent } from "./useArtistContent";

type Props = {
  /** Artist name from the route; `""` is the "Unknown Artist" bucket. */
  readonly artistName: string;
};

/**
 * Selected-artist content; remounted per artist via the parent's `key`.
 * Renders the artist header, then the virtualised album / disc / music rows.
 */
export const ArtistContent = ({ artistName }: Props) => {
  const t = useT();
  const {
    artist,
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
    scrollToAlbum,
    albumMusicsOf,
    menuTargetsOfRow,
    openMusicInfo,
    openAlbumInfo,
    removeFromLibrary,
    playingStateOf,
    activeAlbumKey,
  } = useArtistContent(artistName);

  return (
    <Stack className="h-full gap-0">
      <ArtistHeader
        artistName={artistName}
        artist={artist}
        groups={groups}
        playOrder={playOrder}
        onPlayAll={playAll}
        onPlayShuffled={playShuffled}
        onJumpToAlbum={scrollToAlbum}
      />

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
                className={cn(
                  "absolute top-0 left-0 w-full",
                  // The playing row's glow reaches into the next row; raise
                  // its wrapper so the neighbour's accent background never
                  // covers it (the transformed wrappers are stacking contexts).
                  row.type === "music" &&
                    playingStateOf(row.music) !== null &&
                    "z-[1]",
                )}
                style={{
                  height: item.size,
                  transform: `translateY(${item.start}px)`,
                }}
              >
                {row.type === "album" && (
                  <AlbumHeaderRow
                    group={row.group}
                    musics={albumMusicsOf(row.group)}
                    playing={row.group.key === activeAlbumKey}
                    onPlay={() => playAlbum(row.group)}
                    onAddToQueue={() =>
                      commands.appendToQueue(albumMusicsOf(row.group))
                    }
                    onAlbumInfo={() => openAlbumInfo(row.group)}
                  />
                )}
                {row.type === "disc" && (
                  <p className="flex h-8 items-end px-2 font-medium text-muted-foreground text-xs">
                    {t("album.disc", { number: row.disc })}
                  </p>
                )}
                {row.type === "music" && (
                  <ArtistMusicRow
                    music={row.music}
                    playing={playingStateOf(row.music)}
                    selected={selection.selectedIds.has(row.music.id)}
                    menuTargets={menuTargetsOfRow(row.music)}
                    onSelect={(event) => {
                      selectRow(row.music.id, {
                        shift: event.shiftKey,
                        meta: event.metaKey || event.ctrlKey,
                      });
                    }}
                    onPlay={() => playFrom(row.music)}
                    onTogglePlayPause={() => commands.togglePlayPause()}
                    onPlayNext={() => commands.insertNext([row.music])}
                    onAddToQueue={() => commands.appendToQueue([row.music])}
                    onMusicInfo={() => openMusicInfo(row.music)}
                    onRemoveFromLibrary={() => removeFromLibrary(row.music)}
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
