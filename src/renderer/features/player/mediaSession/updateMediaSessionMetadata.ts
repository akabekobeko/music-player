import type { Music } from "@mp/ipc";
import { hasMediaSession } from "./hasMediaSession";
import { metadataInitOf } from "./metadataInitOf";

/**
 * Publish a track's metadata to the OS media controls
 * (`docs/specs/v1.0/features/player-ui.md`): macOS Now Playing / Windows
 * SMTC via the Web standard API — never Main's `globalShortcut`.
 *
 * No useEffect: called from the commands that change the current track
 * (`playMusic` / `playNext` / `playPrevious`).
 *
 * @param music - The new current track, or `null` to clear.
 */
export const updateMediaSessionMetadata = (music: Music | null): void => {
  if (!hasMediaSession()) {
    return;
  }

  const init = metadataInitOf(music);
  navigator.mediaSession.metadata =
    init === null ? null : new MediaMetadata(init);
};
