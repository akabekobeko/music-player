import { Loader2 } from "lucide-react";
import { CircleIconButton } from "@/components/app/Buttons/CircleIconButton";
import { GlowIconButton } from "@/components/app/Buttons/GlowIconButton";
import { PauseFillIcon } from "@/components/app/Icons/PauseFillIcon";
import { PlayFillIcon } from "@/components/app/Icons/PlayFillIcon";
import { SkipBackFillIcon } from "@/components/app/Icons/SkipBackFillIcon";
import { SkipForwardFillIcon } from "@/components/app/Icons/SkipForwardFillIcon";
import { HStack } from "@/components/app/stacks";
import { useT } from "@/features/i18n/useT";

type Props = {
  /** Whether a previous track exists in the queue. */
  readonly hasPrevious: boolean;
  /** Whether a next track exists in the queue. */
  readonly hasNext: boolean;
  /** Whether a track is loaded — gates play/pause. */
  readonly hasTrack: boolean;
  readonly isPlaying: boolean;
  /** Engine is loading — shows a spinner in place of play/pause. */
  readonly isLoading: boolean;
  readonly onPrevious: () => void;
  readonly onTogglePlayPause: () => void;
  readonly onNext: () => void;
};

/**
 * Transport controls: previous, play/pause, next. Stop has no button
 * (Apple Music-style) — it lives in the Controls menu and the bar's
 * right-click menu.
 */
export const PlayerControls = ({
  hasPrevious,
  hasNext,
  hasTrack,
  isPlaying,
  isLoading,
  onPrevious,
  onTogglePlayPause,
  onNext,
}: Props) => {
  const t = useT();
  return (
    <HStack className="gap-1">
      <GlowIconButton
        aria-label={t("player.previous")}
        disabled={!hasPrevious}
        onClick={onPrevious}
      >
        <SkipBackFillIcon />
      </GlowIconButton>
      <CircleIconButton
        className="size-9"
        aria-label={isPlaying ? t("player.pause") : t("player.play")}
        disabled={!hasTrack}
        onClick={onTogglePlayPause}
      >
        {isLoading ? (
          <Loader2 className="size-5 animate-spin" />
        ) : isPlaying ? (
          <PauseFillIcon className="size-5" />
        ) : (
          <PlayFillIcon className="size-5" />
        )}
      </CircleIconButton>
      <GlowIconButton
        aria-label={t("player.next")}
        disabled={!hasNext}
        onClick={onNext}
      >
        <SkipForwardFillIcon />
      </GlowIconButton>
    </HStack>
  );
};
