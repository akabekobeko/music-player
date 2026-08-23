import type { Artist } from "@mp/ipc";
import { useVirtualizer } from "@tanstack/react-virtual";
import { UserRound } from "lucide-react";
import { useRef } from "react";
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

/** Fixed row height for the virtualizer (px). */
const ROW_HEIGHT = 48;

/** Rows kept above the selected artist when the list mounts. */
const ROWS_ABOVE_SELECTED = 2;

type Props = {
  /** Filtered + sorted artists to render. */
  readonly artists: readonly Artist[];
  /** Selected artist name from the route (`""` = unknown bucket). */
  readonly selectedName: string | undefined;
};

/**
 * Virtualised rows of `ArtistListPanel`. Rendered only once the artist list
 * has loaded so the virtualiser's `initialOffset` can bring the selected
 * artist into view at mount — a restored selection (launch, tab switch) is
 * visible without scrolling, like `useQueueList` centring the current track.
 */
export const ArtistListRows = ({ artists, selectedName }: Props) => {
  const t = useT();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const selectedIndex =
    selectedName !== undefined
      ? artists.findIndex((artist) => artist.name === selectedName)
      : -1;
  const virtualizer = useVirtualizer({
    count: artists.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
    initialOffset: Math.max(
      0,
      (selectedIndex - ROWS_ABOVE_SELECTED) * ROW_HEIGHT,
    ),
  });

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto">
      <div
        className="relative w-full"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualizer.getVirtualItems().map((item) => {
          const artist = artists[item.index];
          if (artist === undefined) {
            return null;
          }

          const selected = artist.name === selectedName;
          const row = (
            <button
              type="button"
              className={cn(
                "absolute top-0 left-0 flex w-full items-center gap-2 px-3 text-left text-sm",
                selected
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50",
              )}
              style={{
                height: item.size,
                transform: `translateY(${item.start}px)`,
              }}
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
                  <UserRound
                    aria-hidden
                    className="size-4 text-muted-foreground"
                  />
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
          // Editing keys off the artist name; the empty-name bucket
          // ("Unknown Artist") cannot hold a picture, so no edit there —
          // removal applies to every bucket.
          return (
            <ContextMenu key={artist.name}>
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
        })}
      </div>
    </div>
  );
};
