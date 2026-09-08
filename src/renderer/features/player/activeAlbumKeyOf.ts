import type { Music } from "@mp/ipc";
import type { PlaybackState } from "@/features/audio/types";
import { albumKeyOf } from "@/features/library/groupAlbums/albumKeyOf";

/**
 * The album identity key of the audibly active track, for lighting its
 * album up in the Artist / Album views.
 *
 * Only a playing ("loading" counts) or paused current track has an active
 * album: "stopped" / "error" return `null`, matching `rowPlayingStateOf`,
 * even though the PlayerBar still shows the track as the current selection.
 *
 * @param current - The player's current track.
 * @param playbackState - The engine playback state.
 * @returns The active album's key (`AlbumGroup.key` / `AlbumSummary.albumKey`
 * shape), or `null` while nothing is playing or paused.
 */
export const activeAlbumKeyOf = (
  current: Music | null,
  playbackState: PlaybackState,
): string | null => {
  if (current === null) {
    return null;
  }

  return playbackState === "playing" ||
    playbackState === "loading" ||
    playbackState === "paused"
    ? albumKeyOf(current)
    : null;
};
