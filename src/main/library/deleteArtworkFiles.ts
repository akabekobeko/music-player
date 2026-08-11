import { unlink } from "node:fs/promises";

/**
 * Delete GC'd artwork files from disk, best-effort.
 *
 * Failures are logged and swallowed: the DB rows are already gone, and a
 * file that could not be deleted only wastes disk space — it can never be
 * served again because `pictures` no longer references it.
 *
 * @param filePaths - Paths returned by
 *   {@link import("./removeMusicsFromLibrary").removeMusicsFromLibrary}.
 */
export const deleteArtworkFiles = async (
  filePaths: readonly string[],
): Promise<void> => {
  for (const filePath of filePaths) {
    try {
      await unlink(filePath);
    } catch (error) {
      console.warn(`[remove] failed to delete artwork: ${filePath}`, error);
    }
  }
};
