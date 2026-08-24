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
 * 9 columns × 3 rows so "Other" follows Z on the last row. Clicking a tile
 * jumps the list to that section.
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
        <div className="grid grid-cols-9 gap-1">
          {INITIALS.map((initial) => (
            <Button
              key={initial}
              variant="ghost"
              size="icon"
              disabled={!available.has(initial)}
              className={cn(
                "font-medium",
                initial === OTHER_INITIAL ? "text-[10px]" : "text-sm",
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
