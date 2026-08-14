import { createHash } from "node:crypto";
import type { PictureInfo } from "@akabeko/music-metadata-editor";
import { IMAGE_EXTENSION_BY_MIME } from "./IMAGE_EXTENSION_BY_MIME";

/**
 * Content-hash file name for an image: SHA-256 of the bytes plus a
 * MIME-derived extension.
 *
 * Images are never stored as DB BLOBs
 * (`docs/specs/v1.0/features/library.md`) — they live as
 * `userData/images/<sha256>.<ext>` files and the DB holds paths, so identical
 * artwork across an album collapses into one file.
 *
 * @param picture - Image data and MIME type.
 * @returns File name like `"ab12….jpg"`.
 */
export const artworkFileName = (picture: PictureInfo): string => {
  const hash = createHash("sha256").update(picture.data).digest("hex");
  const extension =
    IMAGE_EXTENSION_BY_MIME[picture.mimeType.toLowerCase()] ?? "img";
  return `${hash}.${extension}`;
};
