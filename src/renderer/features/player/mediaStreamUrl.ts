import { PROTOCOL_MEDIA_STREAM } from "../../../shared/constants";

/**
 * Build the `media-stream://` URL for an absolute file path.
 *
 * Each path segment is percent-encoded individually so separators survive
 * while `#`, `?`, and non-ASCII characters do not break the URL; Main
 * decodes the remainder with `decodeURIComponent`
 * (`src/main/protocol/urlToFilePath.ts`).
 *
 * @param filePath - Absolute path from `Music.filePath`.
 * @returns The playable URL.
 */
export const toMediaStreamUrl = (filePath: string): string =>
  `${PROTOCOL_MEDIA_STREAM}://${filePath
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
