import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PictureInfo } from "@akabeko/music-metadata-editor";
import { artworkFileName } from "./artworkFileName";

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
