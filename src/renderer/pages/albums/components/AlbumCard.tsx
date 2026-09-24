import type { AlbumSummary } from "@mp/ipc";
import { Disc3, Trash2 } from "lucide-react";
import { EllipsisText } from "@/components/app/EllipsisText/EllipsisText";
import { PlayFillIcon } from "@/components/app/Icons/PlayFillIcon";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useT } from "@/features/i18n/useT";
import { libraryRemoveStore } from "@/features/library/libraryRemoveStore";
import { toMediaFileUrl } from "@/libs/toMediaFileUrl";
import { cn } from "@/libs/utils";

type Props = {
  /** The album shown: artwork, name, artist, year, and its identity key. */
  readonly album: AlbumSummary;
  /** Card width in px, computed by the grid layout. */
  readonly width: number;
  /** Whether this card's album is shown in the detail pane below the grid. */
  readonly expanded: boolean;
  /** Whether this card's album contains the playing / paused track. */
  readonly playing: boolean;
  /** Artwork click; the page expands or collapses this album's detail. */
  readonly onToggle: () => void;
  /** Hover play button click; the page queues this album from the top. */
  readonly onPlay: () => void;
};

/**
 * Classes for the artwork button. Both states light the border up with a
 * blurred glow like the `Sidebar` tabs, and the glow strength is set by the
 * border thickness: hovering the card adds a 1px spread ring on top of the
 * border so it reads as a thicker, stronger lamp; the card of the playing /
 * paused album keeps only the plain border plus the blur, so it stays
 * visible once the pointer leaves without competing with the hovered card.
 * The expanded card is deliberately not lit: the detail pane's header shows
 * its artwork instead, so the glow can mean "playing" alone.
 */
const artworkClassName = (playing: boolean): string =>
  cn(
    "block w-full overflow-hidden rounded-md border border-transparent outline-none transition-[border-color,box-shadow] duration-200 focus-visible:ring-3 focus-visible:ring-ring/50",
    "group-hover:border-foreground",
    "group-hover:shadow-[0_0_0_1px_var(--foreground),0_0_5px_1px_color-mix(in_oklch,var(--foreground)_60%,transparent)]",
    playing &&
      "border-foreground shadow-[0_0_5px_1px_color-mix(in_oklch,var(--foreground)_60%,transparent)]",
  );

/**
 * One album card: artwork (click = toggle the detail pane) with a hover
 * play overlay, then name / artist / year. Hovering the card and playing /
 * pausing one of its tracks light the artwork border up with a glow (see
 * `artworkClassName`); a stopped player lights nothing.
 * Right-click opens the context menu with "Remove from library"
 * (confirmation via `LibraryRemoveDialog`).
 */
export const AlbumCard = ({
  album,
  width,
  expanded,
  playing,
  onToggle,
  onPlay,
}: Props) => {
  const t = useT();
  const card = (
    <div className="group shrink-0" style={{ width }}>
      <div className="relative">
        <button
          type="button"
          aria-expanded={expanded}
          aria-label={album.album}
          className={artworkClassName(playing)}
          onClick={onToggle}
        >
          {album.picturePath !== null ? (
            <img
              src={toMediaFileUrl(album.picturePath)}
              alt=""
              loading="lazy"
              className="aspect-square w-full bg-muted object-cover"
            />
          ) : (
            <span className="flex aspect-square w-full items-center justify-center bg-muted">
              <Disc3 aria-hidden className="size-10 text-muted-foreground" />
            </span>
          )}
        </button>
        <button
          type="button"
          aria-label={`${t("menu.playAlbum")}: ${album.album}`}
          className="absolute right-2 bottom-2 flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-md transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
          onClick={onPlay}
        >
          <PlayFillIcon className="size-4" />
        </button>
      </div>
      <EllipsisText className="pt-2 font-medium text-sm" text={album.album} />
      <EllipsisText
        className="text-muted-foreground text-xs"
        text={album.artist}
      />
      <p className="text-muted-foreground text-xs tabular-nums">
        {album.year !== null ? album.year : "—"}
      </p>
    </div>
  );
  return (
    <ContextMenu>
      <ContextMenuTrigger render={card} />
      <ContextMenuContent>
        <ContextMenuItem
          variant="destructive"
          onClick={() => {
            libraryRemoveStore.open({
              kind: "album",
              albumKey: album.albumKey,
              album: album.album,
            });
          }}
        >
          <Trash2 />
          {t("menu.removeFromLibrary")}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
