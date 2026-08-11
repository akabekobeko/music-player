import { PROTOCOL_MEDIA_FILE } from "../../shared/constants";
import { encodePath } from "./encodePath";

/**
 * `media-file://` URL for an artwork image (`<img src>`)
 * (`docs/specs/v1.0/architecture/process-model.md`).
 *
 * @param filePath - Absolute path under `userData/images/`.
 * @returns The displayable URL.
 */
export const toMediaFileUrl = (filePath: string): string =>
  `${PROTOCOL_MEDIA_FILE}://${encodePath(filePath)}`;
