import { useVirtualizer } from "@tanstack/react-virtual";
import { Disc3, MoreHorizontal, Play, Shuffle, UserRound } from "lucide-react";
import { useRef } from "react";
import { useParams } from "react-router";
import { MusicRow } from "@/components/app/MusicList/MusicList";
import { Button } from "@/components/ui/button";
import { useT } from "@/features/i18n/useT";
import { groupAlbums } from "@/features/library/groupAlbums";
import { useArtistMusics, useArtists } from "@/features/library/useArtists";
import { formatTime } from "@/libs/formatTime";
import { toMediaFileUrl } from "@/libs/mediaUrl";
import { ALBUM_ROW_HEIGHTS, buildAlbumRows } from "./albumRows";

/**
 * Artist view content (`/artists/:artistName`)
 * (`docs/specs/v1.0/features/artist-view.md`): header (image, counts,
 * Play / Shuffle) and the album sections with disc-split track lists.
 *
 * Albums / discs / tracks render as one flat virtualized row stream
 * (`albumRows.ts`); grouping and ordering are render-time derivations.
 * Playback wiring (Play / Shuffle / row play / menus) lands with #43 —
 * the controls are present but disabled here.
 */
export const ArtistsPage = () => {
  const t = useT();
  const { artistName } = useParams();
  return (
    <div className="h-full">
      {artistName !== undefined ? (
        <ArtistContent key={artistName} artistName={artistName} />
      ) : (
        <section className="p-6">
          <p className="text-muted-foreground text-sm">
            {t("artist.selectPrompt")}
          </p>
        </section>
      )}
    </div>
  );
};

/** Selected-artist content; remounted per artist via the `key` above. */
const ArtistContent = ({ artistName }: { readonly artistName: string }) => {
  const t = useT();
  const artistsState = useArtists();
  const musicsState = useArtistMusics(artistName);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const musics = musicsState.status === "success" ? musicsState.value : [];
  const groups = groupAlbums(musics);
  const rows = buildAlbumRows(groups);
  const artist =
    artistsState.status === "success"
      ? (artistsState.value.find((entry) => entry.name === artistName) ?? null)
      : null;

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => {
      const row = rows[index];
      return row !== undefined ? ALBUM_ROW_HEIGHTS[row.type] : 36;
    },
    overscan: 12,
  });

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-4 border-b px-6 py-4">
        {artist?.picturePath != null ? (
          <img
            src={toMediaFileUrl(artist.picturePath)}
            alt=""
            className="size-16 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-muted">
            <UserRound aria-hidden className="size-7 text-muted-foreground" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-semibold text-lg">{artistName}</h1>
          <p className="text-muted-foreground text-sm">
            {t("artist.albumCount", { count: groups.length })}
            {" · "}
            {t("artist.songs", { count: musics.length })}
          </p>
          <div className="mt-2 flex items-center gap-2">
            {/* Wired to PlayerCommands in #43. */}
            <Button size="sm" disabled>
              <Play /> {t("player.play")}
            </Button>
            <Button size="sm" variant="outline" disabled>
              <Shuffle /> {t("player.shuffle")}
            </Button>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Menu"
          disabled
          className="self-start"
        >
          <MoreHorizontal />
        </Button>
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
                  <div className="flex items-end gap-4 pt-6 pb-2">
                    {row.group.picturePath !== null ? (
                      <img
                        src={toMediaFileUrl(row.group.picturePath)}
                        alt=""
                        className="size-28 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <span className="flex size-28 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Disc3
                          aria-hidden
                          className="size-10 text-muted-foreground"
                        />
                      </span>
                    )}
                    <div className="min-w-0 flex-1 pb-1">
                      <h2 className="truncate font-medium text-base">
                        {row.group.album}
                      </h2>
                      <p className="truncate text-muted-foreground text-xs">
                        {[
                          row.group.year !== null
                            ? String(row.group.year)
                            : null,
                          row.group.genre !== "" ? row.group.genre : null,
                          t("artist.songs", { count: row.group.musicCount }),
                          formatTime(row.group.totalDurationMs / 1000),
                        ]
                          .filter((part) => part !== null)
                          .join(" · ")}
                      </p>
                    </div>
                    {/* Album menu arrives with #43. */}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Menu"
                      disabled
                    >
                      <MoreHorizontal />
                    </Button>
                  </div>
                )}
                {row.type === "disc" && (
                  <p className="flex h-8 items-end px-2 font-medium text-muted-foreground text-xs">
                    {t("album.disc", { number: row.disc })}
                  </p>
                )}
                {row.type === "music" && <MusicRow music={row.music} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
