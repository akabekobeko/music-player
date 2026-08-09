import {
  PROTOCOL_MEDIA_FILE,
  PROTOCOL_MEDIA_STREAM,
} from "../../shared/constants";

/**
 * Builders for the custom-protocol URLs
 * (`docs/specs/v1.0/architecture/process-model.md`).
 *
 * Each path segment is percent-encoded individually so separators survive
 * while `#`, `?`, and non-ASCII characters do not break the URL; Main
 * decodes the remainder with `decodeURIComponent`
 * (`src/main/protocol/urlToFilePath.ts`).
 */

/** Percent-encode an absolute path, keeping `/` separators. */
const encodePath = (filePath: string): string =>
  filePath.split("/").map(encodeURIComponent).join("/");

/**
 * `media-stream://` URL for an audio file (`<audio src>` and `fetch()`).
 *
 * @param filePath - Absolute path from `Music.filePath`.
 * @returns The playable URL.
 */
export const toMediaStreamUrl = (filePath: string): string =>
  `${PROTOCOL_MEDIA_STREAM}://${encodePath(filePath)}`;

/**
 * `media-file://` URL for an artwork image (`<img src>`).
 *
 * @param filePath - Absolute path under `userData/images/`.
 * @returns The displayable URL.
 */
export const toMediaFileUrl = (filePath: string): string =>
  `${PROTOCOL_MEDIA_FILE}://${encodePath(filePath)}`;
