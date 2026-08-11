import type { PlaybackState } from "../../audio/types";

/**
 * Map the engine state onto `mediaSession.playbackState`.
 *
 * @param state - Engine playback state.
 * @returns The MediaSession value (`"none"` for stopped / loading / error).
 */
export const playbackStateOf = (
  state: PlaybackState,
): MediaSessionPlaybackState =>
  state === "playing" ? "playing" : state === "paused" ? "paused" : "none";
