import type { Music } from "@mp/ipc";
import { toMediaFileUrl } from "@/libs/toMediaFileUrl";

/**
 * Build the `MediaMetadata` init for a track
 * (`docs/specs/v1.0/features/player-ui.md`).
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
