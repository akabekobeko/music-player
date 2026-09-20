import { useT } from "@/features/i18n/useT";
import { cn } from "@/libs/utils";
import { AudioLinesIcon } from "../Icons/AudioLinesIcon";
import { PauseFillIcon } from "../Icons/PauseFillIcon";
import { HoverIconButton } from "./HoverIconButton";

type Props = {
  /** Pause the current track. Without it the cell is a plain indicator. */
  readonly onPause?: () => void;
};

/**
 * Leading cell of the playing row: animated equalizer bars, swapped for a
 * pause button on row hover.
 */
export const PlayingButton = ({ onPause }: Props) => {
  const t = useT();
  return (
    <>
      <AudioLinesIcon
        className={cn(
          "size-4 text-primary",
          onPause !== undefined && "group-hover:hidden",
        )}
      />
      {onPause !== undefined && (
        <HoverIconButton
          aria-label={t("player.pause")}
          className="text-primary"
          onClick={onPause}
        >
          <PauseFillIcon className="size-4" />
        </HoverIconButton>
      )}
    </>
  );
};
