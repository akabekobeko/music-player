import { unlink } from "node:fs/promises";

/**
 * Delete GC'd artwork files from disk, best-effort.
 *
 * Failures are swallowed (and logged in development builds): the DB rows
 * are already gone, and a file that could not be deleted only wastes disk
 * space. It can never be served again because `pictures` no longer
 * references it.
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
      if (import.meta.env.DEV) {
        console.warn(`[remove] failed to delete artwork: ${filePath}`, error);
      }
    }
  }
};
