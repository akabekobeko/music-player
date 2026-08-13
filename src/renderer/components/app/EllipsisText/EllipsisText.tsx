import { type MouseEvent, type ReactNode, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/libs/utils";

/**
 * Tooltip open delay (ms). Deliberately longer than Base UI's 600ms default
 * so casual pointer passes over lists do not flash tooltips; only a
 * deliberate hover reveals the full text.
 */
const OPEN_DELAY = 1200;

type Props = {
  /** Full text: shown in the tooltip, and rendered when children is omitted. */
  readonly text: string;
  readonly className?: string;
  /** Styled display content (e.g. mixed-color spans); defaults to `text`. */
  readonly children?: ReactNode;
};

/**
 * Single-line text clipped by an ellipsis. Hovering it shows the full text
 * in a tooltip, but only while the text is actually clipped — clipping is
 * measured on pointer enter (well before the open delay fires), so layout
 * changes need no resize observer.
 */
export const EllipsisText = ({ text, className, children }: Props) => {
  const [clipped, setClipped] = useState(false);
  return (
    <Tooltip>
      <TooltipTrigger
        delay={OPEN_DELAY}
        render={
          // biome-ignore lint/a11y/noStaticElementInteractions: mouseenter only measures clipping for the tooltip; the span itself is not an interactive control.
          <span
            className={cn("block truncate", className)}
            onMouseEnter={(event: MouseEvent<HTMLSpanElement>) => {
              const element = event.currentTarget;
              setClipped(element.scrollWidth > element.clientWidth);
            }}
          />
        }
      >
        {children ?? text}
      </TooltipTrigger>
      {clipped && <TooltipContent className="break-all">{text}</TooltipContent>}
    </Tooltip>
  );
};
