import { TextInitial } from "lucide-react";
import { useState } from "react";
import { GlowIconButton } from "@/components/app/Buttons/GlowIconButton";
import { InitialGrid } from "@/components/app/InitialGrid/InitialGrid";
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
import type { Initial } from "./initials";

type Props = {
  /** Initials that have at least one artist; the rest are disabled tiles. */
  readonly available: ReadonlySet<Initial>;
  /** Called with the tile the user clicked; the popover closes itself. */
  readonly onSelect: (initial: Initial) => void;
};

/**
 * Icon-only header button (Lucide `TextInitial`, delayed tooltip from the
 * surrounding `TooltipProvider`) opening a popover of A–Z + "Other" tiles
 * (`InitialGrid`). Clicking a tile jumps the list to that section.
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
                <GlowIconButton className="shrink-0" aria-label={label}>
                  <TextInitial />
                </GlowIconButton>
              }
            />
          }
        />
        <TooltipContent side="bottom">{label}</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-auto">
        <InitialGrid
          available={available}
          onSelect={(initial) => {
            setOpen(false);
            onSelect(initial);
          }}
        />
      </PopoverContent>
    </Popover>
  );
};
