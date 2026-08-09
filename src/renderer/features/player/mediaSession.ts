import type { Music } from "@mp/ipc";
import { toMediaFileUrl } from "@/libs/mediaUrl";
import type { PlaybackSnapshot, PlaybackState } from "../audio/types";
import { getActivePlayer } from "./playerBridge";

/**
 * MediaSession integration (`docs/specs/v1.0/features/player-ui.md`):
 * OS media controls (macOS Now Playing / Windows SMTC) and hardware media
 * keys via the Web standard API — never Main's `globalShortcut`.
 *
 * No useEffect anywhere: metadata updates run inside the commands that
 * change the current track, and playbackState / position sync runs inside
 * the engine-snapshot subscription those commands register. The pure
 * builders below are unit-tested; the appliers are thin guards around
 * `navigator.mediaSession`.
 */

/** Whether the runtime exposes MediaSession (guards Node test runs too). */
const hasMediaSession = (): boolean =>
  typeof navigator !== "undefined" && "mediaSession" in navigator;

/**
 * Build the `MediaMetadata` init for a track.
 *
 * Artwork uses the `media-file://` URL. Should a platform reject custom
 * protocols here, the recorded fallback is a Blob URL — to be verified in
 * the Phase 4 integration QA (issue #39).
 *
 * @param music - Current track, or `null` when nothing is loaded.
 * @returns The init object, or `null` to clear the metadata.
 */
export const metadataInitOf = (
  music: Music | null,
): (MediaMetadataInit & { title: string }) | null =>
  music === null
    ? null
    : {
        title: music.title,
        artist: music.artist,
        album: music.album,
        artwork:
          music.picturePath !== null
            ? [{ src: toMediaFileUrl(music.picturePath) }]
            : [],
      };

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

/**
 * Build the `setPositionState` payload for a snapshot.
 *
 * @param snapshot - Engine snapshot.
 * @returns The payload, or `null` while the duration is unknown (the
 *   position state is then cleared).
 */
export const positionStateOf = (
  snapshot: PlaybackSnapshot,
): { duration: number; position: number; playbackRate: number } | null =>
  snapshot.duration > 0
    ? {
        duration: snapshot.duration,
        position: Math.min(
          Math.max(0, snapshot.currentTime),
          snapshot.duration,
        ),
        playbackRate: 1,
      }
    : null;

/**
 * Publish a track's metadata to the OS media controls.
 *
 * Called from the commands that change the current track (`playMusic` /
 * `playNext` / `playPrevious`).
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

/**
 * Sync `playbackState` and the position state from an engine snapshot.
 *
 * Called from the engine subscription registered inside `startEngine` — the
 * sync never passes through React rendering.
 *
 * @param snapshot - Latest engine snapshot.
 */
export const syncMediaSessionPlayback = (snapshot: PlaybackSnapshot): void => {
  if (!hasMediaSession()) {
    return;
  }

  navigator.mediaSession.playbackState = playbackStateOf(snapshot.state);
  try {
    const position = positionStateOf(snapshot);
    if (position !== null) {
      navigator.mediaSession.setPositionState(position);
    } else {
      navigator.mediaSession.setPositionState();
    }
  } catch {
    // Chromium rejects transiently inconsistent values (e.g. position just
    // past a shrinking duration); the next snapshot corrects it.
  }
};

/** One-shot guard for {@link registerMediaSessionHandlers}. */
let handlersRegistered = false;

/**
 * Register the MediaSession action handlers exactly once.
 *
 * Called from PlayerProvider's render (guarded, so StrictMode's double
 * render cannot re-register). Handlers resolve the commands through the
 * player bridge at event time, so they never go stale.
 */
export const registerMediaSessionHandlers = (): void => {
  if (!hasMediaSession() || handlersRegistered) {
    return;
  }

  handlersRegistered = true;
  const session = navigator.mediaSession;

  session.setActionHandler("play", () => {
    const player = getActivePlayer();
    if (player !== null && player.getSnapshot().state !== "playing") {
      player.commands.togglePlayPause();
    }
  });
  session.setActionHandler("pause", () => {
    const player = getActivePlayer();
    if (player !== null && player.getSnapshot().state === "playing") {
      player.commands.togglePlayPause();
    }
  });
  session.setActionHandler("previoustrack", () => {
    void getActivePlayer()?.commands.playPrevious();
  });
  session.setActionHandler("nexttrack", () => {
    void getActivePlayer()?.commands.playNext();
  });
  session.setActionHandler("seekto", (details) => {
    if (details.seekTime !== undefined && details.seekTime !== null) {
      getActivePlayer()?.commands.seek(details.seekTime);
    }
  });
};
