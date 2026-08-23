import { Loader2 } from "lucide-react";
import {
  PauseIcon,
  PlayIcon,
  SkipBackIcon,
  SkipForwardIcon,
} from "@/components/app/Icons/Icons";
import { HStack } from "@/components/app/stacks";
import { Button } from "@/components/ui/button";
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
    <HStack className="gap-0.5">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t("player.previous")}
        disabled={!hasPrevious}
        onClick={onPrevious}
      >
        <SkipBackIcon />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={isPlaying ? t("player.pause") : t("player.play")}
        disabled={!hasTrack}
        onClick={onTogglePlayPause}
      >
        {isLoading ? (
          <Loader2 className="animate-spin" />
        ) : isPlaying ? (
          <PauseIcon />
        ) : (
          <PlayIcon />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t("player.next")}
        disabled={!hasNext}
        onClick={onNext}
      >
        <SkipForwardIcon />
      </Button>
    </HStack>
  );
};
