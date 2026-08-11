import type { DatabaseSync } from "node:sqlite";

/**
 * Whether `filePath` is a track registered in the library.
 *
 * `media-stream://` must only serve files the user imported — audio-player
 * served any path verbatim, which allowed arbitrary file reads from the
 * Renderer. The check hits the `musics.file_path` UNIQUE index on the single
 * Main-process connection, so the per-request cost is one indexed lookup.
 *
 * @param db - Open library connection.
 * @param filePath - Decoded, normalised path from {@link import("./urlToFilePath").urlToFilePath}.
 * @returns `true` when the exact path exists in `musics`.
 */
export const isLibraryMusicPath = (
  db: DatabaseSync,
  filePath: string,
): boolean => {
  const row = db
    .prepare("SELECT 1 FROM musics WHERE file_path = ?")
    .get(filePath);
  return row !== undefined;
};
