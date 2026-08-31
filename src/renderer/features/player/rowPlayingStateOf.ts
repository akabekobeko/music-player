import type { Music } from "@mp/ipc";
import type { PlaybackState } from "@/features/audio/types";

/** Playback badge of one track row (`MusicRow`'s `playing` prop). */
export type RowPlayingState = "playing" | "paused" | null;

/**
 * Map the player state to a track row's playback badge (the leading-cell
 * indicator, Apple Music style).
 *
 * Only an audibly active current track marks its row: "playing" ("loading"
 * counts — the track is becoming audible) shows the equalizer bars and
 * "paused" the speaker. "stopped" / "error" return `null` so the row falls
 * back to its plain track number, even though the PlayerBar still shows the
 * track as the current selection.
 *
 * @param current - The player's current track.
 * @param playbackState - The engine playback state.
 * @param music - The row's track.
 * @returns The row badge; `null` for every row that is not the current track.
 */
export const rowPlayingStateOf = (
  current: Music | null,
  playbackState: PlaybackState,
  music: Music,
): RowPlayingState => {
  if (current === null || current.id !== music.id) {
    return null;
  }

  if (playbackState === "playing" || playbackState === "loading") {
    return "playing";
  }

  return playbackState === "paused" ? "paused" : null;
};
