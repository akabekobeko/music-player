import { Button } from "@/components/ui/button";
import { useT } from "@/features/i18n/useT";
import { cn } from "@/libs/utils";
import {
  INITIALS,
  type Initial,
  OTHER_INITIAL,
} from "@/pages/artists/components/ArtistListPanel/initials";

type Props = {
  /**
   * Initials that can be clicked; the rest render as disabled tiles. Omit
   * to enable every tile.
   */
  readonly available?: ReadonlySet<Initial>;
  /**
   * Tile shown as the current choice: lit like a hovered tile (foreground
   * border + blurred glow) plus an `accent` background so it stays visible
   * once the pointer leaves.
   */
  readonly selected?: Initial;
  /** Called with the tile the user clicked. */
  readonly onSelect: (initial: Initial) => void;
  /** Extra classes of the grid container (e.g. `justify-items-center`). */
  readonly className?: string;
};

/**
 * Grid of A–Z + "Other" tiles — 7 columns × 4 rows, "Other" following Z and
 * spanning the remaining two cells so the last row is full. Hovering a tile
 * lights up its border with a blurred glow (same treatment as
 * `CircleIconButton`). Shared by the artist list's jump popover
 * (`InitialPicker`) and the artist info dialog's initial setting.
 */
export const InitialGrid = ({
  available,
  selected,
  onSelect,
  className,
}: Props) => {
  const t = useT();
  return (
    <div className={cn("grid grid-cols-7 gap-1", className)}>
      {INITIALS.map((initial) => (
        <Button
          key={initial}
          variant="ghost"
          size="icon"
          disabled={available !== undefined && !available.has(initial)}
          aria-pressed={
            selected !== undefined ? initial === selected : undefined
          }
          className={cn(
            "border border-transparent bg-transparent font-medium transition-[border-color,box-shadow,background-color] duration-200",
            "hover:border-foreground hover:bg-transparent hover:text-foreground dark:hover:bg-transparent",
            "hover:shadow-[0_0_5px_1px_color-mix(in_oklch,var(--foreground)_60%,transparent)]",
            initial === selected &&
              "border-foreground bg-accent text-accent-foreground shadow-[0_0_5px_1px_color-mix(in_oklch,var(--foreground)_60%,transparent)] hover:bg-accent dark:hover:bg-accent",
            initial === OTHER_INITIAL ? "col-span-2 w-full text-xs" : "text-sm",
          )}
          onClick={() => {
            onSelect(initial);
          }}
        >
          {initial === OTHER_INITIAL ? t("artist.initialOther") : initial}
        </Button>
      ))}
    </div>
  );
};
