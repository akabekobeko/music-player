import type { Music } from "@mp/ipc";

/**
 * Build the `MediaMetadata` init for a track
 * (`docs/specs/v1.0/features/player-ui.md`).
 *
 * The artwork is a Blob URL supplied by the caller: Chromium accepts only
 * http / https / data / blob in `MediaImage.src` and logs a warning for the
 * `media-file://` URL the rest of the app displays (issue #268).
 *
 * @param music - Current track, or `null` when nothing is loaded.
 * @param artworkUrl - Blob URL of the track's artwork, or `null` when the
 *   track has none or it is not loaded yet.
 * @returns The init object, or `null` to clear the metadata.
 */
export const metadataInitOf = (
  music: Music | null,
  artworkUrl: string | null,
): (MediaMetadataInit & { title: string }) | null =>
  music === null
    ? null
    : {
        title: music.title,
        artist: music.artist,
        album: music.album,
        artwork: artworkUrl !== null ? [{ src: artworkUrl }] : [],
      };
