import type { Music } from "@mp/ipc";
import { Disc3, ListEnd, NotepadText, Trash2 } from "lucide-react";
import { AddToPlaylistSubmenu } from "@/components/app/AddToPlaylistSubmenu/AddToPlaylistSubmenu";
import { EllipsisText } from "@/components/app/EllipsisText/EllipsisText";
import { PlayFillIcon } from "@/components/app/Icons/PlayFillIcon";
import { RowMenu } from "@/components/app/RowMenu/RowMenu";
import { useFetchMusicInfoItem } from "@/components/app/RowMenu/useFetchMusicInfoItem";
import { HStack, VStack } from "@/components/app/stacks";
import { useT } from "@/features/i18n/useT";
import { albumInfoStore } from "@/features/library/albumInfoStore";
import type { AlbumGroup } from "@/features/library/groupAlbums/types";
import { libraryRemoveStore } from "@/features/library/libraryRemoveStore";
import { formatTime } from "@/libs/formatTime";
import { toMediaFileUrl } from "@/libs/toMediaFileUrl";
import { cn } from "@/libs/utils";

type Props = {
  /** The album section: identity key, artwork, title, and summary fields. */
  readonly group: AlbumGroup;
  /** The album's tracks in disc / track order (menu targets). */
  readonly musics: readonly Music[];
  /** Whether the album contains the playing / paused track. */
  readonly playing: boolean;
  /** Play overlay / menu "Play album"; the parent queues this album. */
  readonly onPlay: () => void;
  /** Menu "Add to queue"; the parent appends this album's tracks. */
  readonly onAddToQueue: () => void;
};

/**
 * Classes for the artwork frame. Both states light the border up with a
 * blurred glow like the `AlbumCard` artwork, and the glow strength is set by
 * the border thickness: hovering adds a 1px spread ring on top of the border
 * so it reads as a thick, strong lamp; the playing / paused album keeps only
 * the plain border plus the blur, so it stays visible once the pointer
 * leaves without competing with the hovered frame. The frame keeps its own
 * `size-28` so the border does not grow the row; the picture fills it.
 */
const artworkClassName = (playing: boolean): string =>
  cn(
    "group relative size-28 shrink-0 overflow-hidden rounded-md border border-transparent transition-[border-color,box-shadow] duration-200",
    "hover:border-foreground",
    "hover:shadow-[0_0_0_1px_var(--foreground),0_0_5px_1px_color-mix(in_oklch,var(--foreground)_60%,transparent)]",
    playing &&
      "border-foreground shadow-[0_0_5px_1px_color-mix(in_oklch,var(--foreground)_60%,transparent)]",
  );

/**
 * Album area: the heading row of one album (artwork, title, summary line,
 * album menu) that precedes its tracks in the virtualised list. Hovering the
 * artwork, and playing / pausing one of the album's tracks, light its border
 * up with a glow (see `artworkClassName`); hovering also reveals a play
 * overlay, as the artist picture in `ArtistHeader` does.
 */
export const AlbumHeaderRow = ({
  group,
  musics,
  playing,
  onPlay,
  onAddToQueue,
}: Props) => {
  const t = useT();
  const fetchMusicInfoItem = useFetchMusicInfoItem();

  return (
    <HStack className="items-end gap-4 pt-6 pr-2 pb-4">
      <div className={artworkClassName(playing)}>
        {group.picturePath !== null ? (
          <img
            src={toMediaFileUrl(group.picturePath)}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <VStack className="size-full bg-muted">
            <Disc3 aria-hidden className="size-10 text-muted-foreground" />
          </VStack>
        )}
        <button
          type="button"
          aria-label={`${t("menu.playAlbum")}: ${group.album}`}
          title={t("menu.playAlbum")}
          className="absolute inset-0 m-auto flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-md transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
          onClick={onPlay}
        >
          <PlayFillIcon className="size-4" />
        </button>
      </div>
      <div className="min-w-0 flex-1 pb-1">
        <h2 className="font-medium text-base">
          <EllipsisText text={group.album} />
        </h2>
        <EllipsisText
          className="text-muted-foreground text-xs"
          text={[
            group.year !== null ? String(group.year) : null,
            group.genre !== "" ? group.genre : null,
            t("artist.songs", { count: group.musicCount }),
            formatTime(group.totalDurationMs / 1000),
          ]
            .filter((part) => part !== null)
            .join(" · ")}
        />
      </div>
      <RowMenu
        variant="circle"
        items={[
          {
            label: t("menu.playAlbum"),
            icon: <PlayFillIcon />,
            onSelect: onPlay,
          },
          {
            label: t("menu.addToQueue"),
            icon: <ListEnd />,
            onSelect: onAddToQueue,
          },
          <AddToPlaylistSubmenu key="playlist" musics={musics} />,
          {
            label: t("menu.albumInfo"),
            icon: <NotepadText />,
            onSelect: () => albumInfoStore.open(group),
            separatorBefore: true,
          },
          fetchMusicInfoItem(musics),
          {
            label: t("menu.removeFromLibrary"),
            icon: <Trash2 />,
            onSelect: () =>
              libraryRemoveStore.open({
                kind: "album",
                albumKey: group.key,
                album: group.album,
              }),
            destructive: true,
            separatorBefore: true,
          },
        ]}
      />
    </HStack>
  );
};
