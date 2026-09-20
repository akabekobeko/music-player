import { cn } from "@/libs/utils";
import { PlayFillIcon } from "../Icons/PlayFillIcon";
import { HoverIconButton } from "./HoverIconButton";

type Props = {
  /** Track number (or ordinal) shown while the row is not hovered. */
  readonly number: number | string;
  /** Track title, used as the accessible name of the play button. */
  readonly title: string;
  /** Start playback from this track. Without it the cell is a plain number. */
  readonly onPlay?: () => void;
};

/**
 * Leading cell of a stopped row (not the current track): the track number,
 * swapped for a play button on row hover.
 */
export const TrackNumberButton = ({ number, title, onPlay }: Props) => (
  <>
    <span className={cn(onPlay !== undefined && "group-hover:hidden")}>
      {number}
    </span>
    {onPlay !== undefined && (
      <HoverIconButton aria-label={title} onClick={onPlay}>
        <PlayFillIcon className="size-4" />
      </HoverIconButton>
    )}
  </>
);
