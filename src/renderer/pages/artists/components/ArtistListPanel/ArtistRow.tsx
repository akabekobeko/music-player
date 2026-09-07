import type { Artist } from "@mp/ipc";
import { NotepadText, Trash2, UserRound } from "lucide-react";
import { useNavigate } from "react-router";
import { EllipsisText } from "@/components/app/EllipsisText/EllipsisText";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useT } from "@/features/i18n/useT";
import { artistEditStore } from "@/features/library/artistEditStore";
import { libraryRemoveStore } from "@/features/library/libraryRemoveStore";
import { toMediaFileUrl } from "@/libs/toMediaFileUrl";
import { cn } from "@/libs/utils";
import { artistPathOf } from "../../artistPath";

type Props = {
  readonly artist: Artist;
  /** Whether this artist is the one selected by the route. */
  readonly selected: boolean;
  /** Virtualised position: top offset and height in px. */
  readonly top: number;
  readonly height: number;
};

/**
 * Classes for the row button. Both states light the border up with a
 * blurred glow like the `Sidebar` tabs, and the glow strength is set by the
 * border thickness: hover adds a 1px spread ring on top of the border so it
 * reads as a thicker, stronger lamp; the selected row keeps only the plain
 * border plus the blur (and its accent background), so it stays visible once
 * the pointer leaves without competing with the hovered row. Rows abut each
 * other inside the scroll area, so the button is inset from the panel edges
 * (`inset-x-2`, with the inner padding reduced to keep the picture where it
 * was) to leave room for the glow, and the hovered row is raised above its
 * neighbours so its glow is not covered by the next row's background.
 */
const rowClassName = (selected: boolean): string =>
  cn(
    "absolute inset-x-2 top-0 flex items-center gap-3 rounded-md border border-transparent px-1 text-left text-sm transition-[color,background-color,border-color,box-shadow] duration-200",
    "hover:z-10 hover:border-foreground hover:text-sidebar-foreground",
    "hover:shadow-[0_0_0_1px_var(--foreground),0_0_5px_1px_color-mix(in_oklch,var(--foreground)_60%,transparent)]",
    selected
      ? "border-foreground bg-sidebar-accent text-sidebar-accent-foreground shadow-[0_0_5px_1px_color-mix(in_oklch,var(--foreground)_60%,transparent)]"
      : "text-sidebar-foreground/80",
  );

/**
 * One virtualised artist row (picture, name, song count) with its context
 * menu. Hovering and selection light the row border up with a glow (see
 * `rowClassName`). Editing keys off the artist name; the empty-name bucket
 * ("Unknown Artist") cannot hold a picture, so no edit there — removal
 * applies to every bucket.
 */
export const ArtistRow = ({ artist, selected, top, height }: Props) => {
  const t = useT();
  const navigate = useNavigate();
  const row = (
    <button
      type="button"
      className={rowClassName(selected)}
      style={{ height, transform: `translateY(${top}px)` }}
      onClick={() => {
        navigate(artistPathOf(artist.name));
      }}
    >
      {artist.picturePath !== null ? (
        <img
          src={toMediaFileUrl(artist.picturePath)}
          alt=""
          className="size-8 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
          <UserRound aria-hidden className="size-4 text-muted-foreground" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <EllipsisText
          text={artist.name !== "" ? artist.name : t("artist.unknown")}
        />
        <span className="block truncate text-[11px] text-muted-foreground">
          {t("artist.songs", { count: artist.musicCount })}
        </span>
      </span>
    </button>
  );
  return (
    <ContextMenu>
      <ContextMenuTrigger render={row} />
      <ContextMenuContent>
        {artist.name !== "" && (
          <>
            <ContextMenuItem
              onClick={() => {
                artistEditStore.open({
                  name: artist.name,
                  picturePath: artist.picturePath,
                  musicCount: artist.musicCount,
                  initial: artist.initial,
                });
              }}
            >
              <NotepadText />
              {t("artistEdit.menu")}
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        <ContextMenuItem
          variant="destructive"
          onClick={() => {
            libraryRemoveStore.open({
              kind: "artist",
              artist: artist.name,
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
