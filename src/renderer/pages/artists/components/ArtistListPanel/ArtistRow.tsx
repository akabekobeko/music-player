import type { Artist } from "@mp/ipc";
import { UserRound } from "lucide-react";
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
 * One virtualised artist row (picture, name, song count) with its context
 * menu. Editing keys off the artist name; the empty-name bucket ("Unknown
 * Artist") cannot hold a picture, so no edit there — removal applies to
 * every bucket.
 */
export const ArtistRow = ({ artist, selected, top, height }: Props) => {
  const t = useT();
  const navigate = useNavigate();
  const row = (
    <button
      type="button"
      className={cn(
        "absolute top-0 left-0 flex w-full items-center gap-2 px-3 text-left text-sm",
        selected
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50",
      )}
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
          {t("menu.removeFromLibrary")}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
