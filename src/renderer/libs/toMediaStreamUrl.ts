import { PROTOCOL_MEDIA_STREAM } from "../../shared/constants";
import { encodePath } from "./encodePath";

/**
 * `media-stream://` URL for an audio file (`<audio src>` and `fetch()`)
 * (`docs/specs/v1.0/architecture/process-model.md`).
 *
 * @param filePath - Absolute path from `Music.filePath`.
 * @returns The playable URL.
 */
export const toMediaStreamUrl = (filePath: string): string =>
  `${PROTOCOL_MEDIA_STREAM}://${encodePath(filePath)}`;
