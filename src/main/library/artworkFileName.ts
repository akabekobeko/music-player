import { createHash } from "node:crypto";
import type { PictureInfo } from "@akabeko/music-metadata-editor";

/** File extension per image MIME type; unknown types keep a generic ext. */
const EXTENSION_BY_MIME: Readonly<Record<string, string>> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/bmp": "bmp",
};

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
  const extension = EXTENSION_BY_MIME[picture.mimeType.toLowerCase()] ?? "img";
  return `${hash}.${extension}`;
};
