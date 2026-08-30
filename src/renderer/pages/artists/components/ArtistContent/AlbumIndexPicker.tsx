import { Disc3, LayoutGrid } from "lucide-react";
import { useState } from "react";
import { CircleIconButton } from "@/components/app/Buttons/CircleIconButton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useT } from "@/features/i18n/useT";
import type { AlbumGroup } from "@/features/library/groupAlbums/types";
import { toMediaFileUrl } from "@/libs/toMediaFileUrl";
import { cn } from "@/libs/utils";

type Props = {
  /**
   * Albums shown as tiles, in list order. Pass the already-filtered groups
   * so albums hidden by the song filter disappear from the grid as well.
   */
  readonly groups: readonly AlbumGroup[];
  /** Called with the clicked album's key; the popover closes itself. */
  readonly onSelect: (albumKey: string) => void;
};

/** Tiles per row; tune after seeing the real artwork sizes. */
const COLUMNS = 5;

/** Delay before a tile's album-name tooltip appears. */
const TOOLTIP_DELAY_MS = 700;

/**
 * Artist header circle button (Lucide `LayoutGrid`) opening a popover of the
 * artist's album artworks — small rounded 40px tiles — in a
 * {@link COLUMNS}-column grid. Hovering a tile lights up its
 * border with a blurred glow (same treatment as `InitialGrid`) and shows the
 * album name in a tooltip; clicking one jumps the content list to that album.
 */
export const AlbumIndexPicker = ({ groups, onSelect }: Props) => {
  const t = useT();
  const [open, setOpen] = useState(false);
  const label = t("artist.albumIndex");
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <CircleIconButton
            aria-label={label}
            title={label}
            disabled={groups.length === 0}
          >
            <LayoutGrid />
          </CircleIconButton>
        }
      />
      <PopoverContent align="end" className="w-auto">
        <TooltipProvider delay={TOOLTIP_DELAY_MS}>
          <div
            className="grid max-h-80 gap-1 overflow-y-auto"
            // Only as many column tracks as there are tiles: the popover is
            // content-sized, so empty tracks would leave their `gap` as a
            // stray right margin when there are fewer albums than COLUMNS.
            style={{
              gridTemplateColumns: `repeat(${Math.min(COLUMNS, groups.length)}, auto)`,
            }}
          >
            {groups.map((group) => (
              <Tooltip key={group.key}>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      aria-label={group.album}
                      className={cn(
                        "flex size-10 items-center justify-center overflow-hidden rounded-md border border-transparent bg-muted transition-[border-color,box-shadow] duration-200 outline-hidden",
                        "hover:border-foreground hover:shadow-[0_0_5px_1px_color-mix(in_oklch,var(--foreground)_60%,transparent)]",
                        "focus-visible:border-foreground focus-visible:shadow-[0_0_5px_1px_color-mix(in_oklch,var(--foreground)_60%,transparent)]",
                      )}
                      onClick={() => {
                        setOpen(false);
                        onSelect(group.key);
                      }}
                    >
                      {group.picturePath !== null ? (
                        <img
                          src={toMediaFileUrl(group.picturePath)}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <Disc3
                          aria-hidden
                          className="size-5 text-muted-foreground"
                        />
                      )}
                    </button>
                  }
                />
                <TooltipContent side="bottom">{group.album}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </PopoverContent>
    </Popover>
  );
};
