import { TextInitial } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useT } from "@/features/i18n/useT";
import { cn } from "@/libs/utils";
import { INITIALS, type Initial, OTHER_INITIAL } from "./initials";

type Props = {
  /** Initials that have at least one artist; the rest are disabled tiles. */
  readonly available: ReadonlySet<Initial>;
  /** Called with the tile the user clicked; the popover closes itself. */
  readonly onSelect: (initial: Initial) => void;
};

/**
 * Icon-only header button (Lucide `TextInitial`, delayed tooltip from the
 * surrounding `TooltipProvider`) opening a popover of A–Z + "Other" tiles —
 * 7 columns × 4 rows, "Other" following Z and spanning the remaining two
 * cells so the last row is full. Hovering a tile lights up its border with a
 * blurred glow (same treatment as `CircleIconButton`). Clicking a tile jumps
 * the list to that section.
 */
export const InitialPicker = ({ available, onSelect }: Props) => {
  const t = useT();
  const [open, setOpen] = useState(false);
  const label = t("artist.initials");
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  aria-label={label}
                >
                  <TextInitial />
                </Button>
              }
            />
          }
        />
        <TooltipContent side="bottom">{label}</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-auto">
        <div className="grid grid-cols-7 gap-1">
          {INITIALS.map((initial) => (
            <Button
              key={initial}
              variant="ghost"
              size="icon"
              disabled={!available.has(initial)}
              className={cn(
                "border border-transparent bg-transparent font-medium transition-[border-color,box-shadow] duration-200",
                "hover:border-foreground hover:bg-transparent hover:text-foreground dark:hover:bg-transparent",
                "hover:shadow-[0_0_5px_1px_color-mix(in_oklch,var(--foreground)_60%,transparent)]",
                initial === OTHER_INITIAL
                  ? "col-span-2 w-full text-xs"
                  : "text-sm",
              )}
              onClick={() => {
                setOpen(false);
                onSelect(initial);
              }}
            >
              {initial === OTHER_INITIAL ? t("artist.initialOther") : initial}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
