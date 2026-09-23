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
 * Classes for the row button. Hover lights the border up with a blurred
 * glow like the `Sidebar` tabs: a 1px spread ring on top of the border plus
 * the blur, so it reads as a thicker, stronger lamp. The selected row is
 * filled with the glow colour (`foreground`) and keeps the plain border but
 * no glow of its own: the solid fill already marks it, and fill plus glow
 * together looked overdone. Hovering the selected row still gets the hover
 * glow. Its text switches to the inverse (`background`) to stay readable on
 * the fill, and keeps that inverse colour on hover, where the plain hover
 * text colour would vanish into the fill. Rows abut each other inside the
 * scroll area, so the button is inset from the panel edges (`inset-x-2`) to
 * leave room for the glow. Rows and initial headings are absolutely
 * positioned siblings painted in list order, so a glow would be covered by
 * an opaque neighbour that follows it, namely the `InitialHeading` right
 * below the row. The hovered row is therefore raised above the plain rows
 * and headings (`z-[2]`), while staying below the pinned heading copy
 * (`z-10` in `ArtistListRows`) that rows must keep sliding under.
 */
const rowClassName = (selected: boolean): string =>
  cn(
    "absolute inset-x-2 top-0 flex items-center gap-3 rounded-md border border-transparent px-2 text-left text-sm transition-[color,background-color,border-color,box-shadow] duration-200",
    "hover:z-[2] hover:border-foreground hover:text-sidebar-foreground",
    "hover:shadow-[0_0_0_1px_var(--foreground),0_0_5px_1px_color-mix(in_oklch,var(--foreground)_60%,transparent)]",
    selected
      ? "border-foreground bg-foreground text-background hover:text-background"
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
        <span
          className={cn(
            "block truncate text-[11px]",
            // The muted colour sinks into the selected row's foreground fill,
            // so use the inverse colour, toned down to keep it secondary.
            selected ? "text-background/70" : "text-muted-foreground",
          )}
        >
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
