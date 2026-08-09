import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { type PictureInfo, PictureKind } from "@akabeko/music-metadata-editor";

/**
 * Artwork extraction and content-hash storage
 * (`docs/specs/v1.0/features/library.md`): images are never stored as DB
 * BLOBs — they live as `userData/images/<sha256>.<ext>` files and the DB
 * holds paths, so identical artwork across an album collapses into one file.
 */

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
 * Pick the picture to use as a track's artwork.
 *
 * `CoverFront` wins; otherwise the first picture is used; no pictures means
 * no artwork.
 *
 * @param pictures - `Track.pictures` from mme.
 * @returns The chosen picture, or `null`.
 */
export const selectArtworkPicture = (
  pictures: readonly PictureInfo[],
): PictureInfo | null =>
  pictures.find((picture) => picture.kind === PictureKind.CoverFront) ??
  pictures[0] ??
  null;

/**
 * Content-hash file name for an image: SHA-256 of the bytes plus a
 * MIME-derived extension.
 *
 * @param picture - Image data and MIME type.
 * @returns File name like `"ab12….jpg"`.
 */
export const artworkFileName = (picture: PictureInfo): string => {
  const hash = createHash("sha256").update(picture.data).digest("hex");
  const extension = EXTENSION_BY_MIME[picture.mimeType.toLowerCase()] ?? "img";
  return `${hash}.${extension}`;
};

/**
 * Persist a picture into the artwork directory, de-duplicated by content
 * hash.
 *
 * The write uses the `wx` flag so an existing file is never rewritten
 * (= the dedup) and two concurrent extraction workers saving the same
 * artwork cannot corrupt each other — the loser's `EEXIST` is the success
 * case.
 *
 * @param imagesDir - Artwork directory (`userData/images`).
 * @param picture - Image to save.
 * @returns Absolute path of the stored file.
 */
export const saveArtwork = async (
  imagesDir: string,
  picture: PictureInfo,
): Promise<string> => {
  const filePath = path.join(imagesDir, artworkFileName(picture));
  await mkdir(imagesDir, { recursive: true });
  try {
    await writeFile(filePath, picture.data, { flag: "wx" });
  } catch (error) {
    if ((error as { code?: string }).code !== "EEXIST") {
      throw error;
    }
  }

  return filePath;
};
