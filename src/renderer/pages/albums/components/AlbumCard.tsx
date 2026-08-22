import type { AlbumSummary } from "@mp/ipc";
import { Disc3, Play } from "lucide-react";
import { EllipsisText } from "@/components/app/EllipsisText/EllipsisText";
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
  readonly album: AlbumSummary;
  /** Card width in px, computed by the grid layout. */
  readonly width: number;
  /** Whether this card's album is shown in the detail pane below the grid. */
  readonly expanded: boolean;
  readonly onToggle: () => void;
  readonly onPlay: () => void;
};

/**
 * One album card: artwork (click = toggle the detail pane) with a hover
 * ▶ overlay, then name / artist / year. Right-click opens the context menu
 * with "Remove from library" (confirmation via `LibraryRemoveDialog`).
 */
export const AlbumCard = ({
  album,
  width,
  expanded,
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
          className={cn(
            "block w-full overflow-hidden rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            expanded && "ring-2 ring-primary",
          )}
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
          aria-label={`${t("player.play")}: ${album.album}`}
          className="absolute right-2 bottom-2 flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-md transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
          onClick={onPlay}
        >
          <Play className="size-4 fill-current" />
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
          {t("menu.removeFromLibrary")}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
