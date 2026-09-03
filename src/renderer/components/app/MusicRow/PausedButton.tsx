import { PlayFillIcon } from "@/components/app/Icons/PlayFillIcon";
import { VolumeFillIcon } from "@/components/app/Icons/VolumeFillIcon";
import { HoverIconButton } from "@/components/app/MusicRow/HoverIconButton";
import { useT } from "@/features/i18n/useT";
import { cn } from "@/libs/utils";

type Props = {
  /**
   * Resume the current track from the paused position. Without it the cell
   * is a plain indicator.
   */
  readonly onResume?: () => void;
};

/**
 * Leading cell of the paused row: the speaker icon, swapped for a resume
 * play button on row hover.
 */
export const PausedButton = ({ onResume }: Props) => {
  const t = useT();
  return (
    <>
      <VolumeFillIcon
        aria-hidden
        className={cn(
          "size-4 text-primary",
          onResume !== undefined && "group-hover:hidden",
        )}
      />
      {onResume !== undefined && (
        <HoverIconButton
          aria-label={t("player.play")}
          className="text-primary"
          onClick={onResume}
        >
          <PlayFillIcon className="size-4" />
        </HoverIconButton>
      )}
    </>
  );
};
