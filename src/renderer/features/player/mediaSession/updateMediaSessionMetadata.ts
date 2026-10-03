import type { Music } from "@mp/ipc";
import {
  type ArtworkBlobUrlCache,
  artworkBlobUrlCache,
} from "./artworkBlobUrlCache";
import { hasMediaSession } from "./hasMediaSession";
import { metadataInitOf } from "./metadataInitOf";

const metadataOf = (
  music: Music | null,
  artworkUrl: string | null,
): MediaMetadata | null => {
  const init = metadataInitOf(music, artworkUrl);
  return init === null ? null : new MediaMetadata(init);
};

/**
 * Publish a track's metadata to the OS media controls
 * (`docs/specs/v1.0/features/player-ui.md`): macOS Now Playing / Windows
 * SMTC via the Web standard API — never Main's `globalShortcut`.
 *
 * No useEffect: called from the commands that change the current track
 * (`playMusic` / `playNext` / `playPrevious`).
 *
 * The text is published at once; the artwork follows as a Blob URL when its
 * load finishes. Tracks sharing an artwork file (one album) reuse the
 * loaded URL and publish once.
 *
 * @param music - The new current track, or `null` to clear.
 * @param artwork - Blob URL cache; defaults to the app-wide one (injectable
 *   for unit tests).
 */
export const updateMediaSessionMetadata = (
  music: Music | null,
  artwork: ArtworkBlobUrlCache = artworkBlobUrlCache,
): void => {
  if (!hasMediaSession()) {
    return;
  }

  const session = navigator.mediaSession;
  const picturePath = music?.picturePath ?? null;
  const loaded = artwork.peek(picturePath);
  const published = metadataOf(music, loaded);
  session.metadata = published;

  void artwork.load(picturePath).then((url) => {
    // Republish only for an artwork that just arrived, and only while this
    // call's metadata is still the published one (tracks sharing an artwork
    // share its load, so an earlier track can resolve after a later one).
    if (url !== null && url !== loaded && session.metadata === published) {
      session.metadata = metadataOf(music, url);
    }
  });
};
