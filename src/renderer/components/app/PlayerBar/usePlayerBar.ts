import { useState } from "react";
import type { PlaybackError } from "@/features/audio/types";
import { nextOf, previousOf } from "@/features/player/derive";
import {
  useAudioPlayer,
  usePlayerCommands,
  usePlayerState,
} from "@/features/player/PlayerProvider";

/**
 * Logic of `PlayerBar`: the queue-derived transport availability, the
 * engine snapshot's display values, and the error dismissal. All display
 * state comes from the player state and the engine snapshot — no polling.
 * The component only renders what this hook returns.
 */
export const usePlayerBar = () => {
  const { queue, current } = usePlayerState();
  const commands = usePlayerCommands();
  const snapshot = useAudioPlayer();
  const [dismissedError, setDismissedError] = useState<PlaybackError | null>(
    null,
  );

  const previous = previousOf(queue, current);
  const next = nextOf(queue, current);
  const hasTrack = current !== null;
  const isPlaying = snapshot.state === "playing";
  const isLoading = snapshot.state === "loading";
  // A new engine (track switch) resets `error` to null — auto-clear;
  // dismissing hides exactly this error object until a new one appears.
  const visibleError =
    snapshot.error !== null && snapshot.error !== dismissedError
      ? snapshot.error
      : null;
  // While the engine has no duration yet, fall back to mme's value for the
  // display only (VBR MP3 may be inaccurate — never used for seeking).
  const displayDuration =
    snapshot.duration > 0
      ? snapshot.duration
      : (current?.durationMs ?? 0) / 1000;

  /** Hide exactly the current error object until a new one appears. */
  const dismissError = (): void => {
    setDismissedError(visibleError);
  };

  return {
    current,
    commands,
    snapshot,
    previous,
    next,
    hasTrack,
    isPlaying,
    isLoading,
    visibleError,
    displayDuration,
    dismissError,
  };
};
