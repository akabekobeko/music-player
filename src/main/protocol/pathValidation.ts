import path from "node:path";
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

/**
 * Resolve a requested image path and verify it stays inside the artwork
 * directory.
 *
 * `media-file://` only serves `userData/images/` — the directory the importer
 * writes SHA-256-named artwork into. Resolution collapses `..` segments, so
 * traversal attempts fall outside `imagesDir` and are rejected.
 *
 * @param filePath - Decoded, normalised path from {@link import("./urlToFilePath").urlToFilePath}.
 * @param imagesDir - Absolute path of the artwork directory.
 * @returns The resolved absolute path, or `null` when it escapes `imagesDir`.
 */
export const resolveImagePath = (
  filePath: string,
  imagesDir: string,
): string | null => {
  const resolvedDir = path.resolve(imagesDir);
  const resolved = path.resolve(filePath);
  return resolved.startsWith(resolvedDir + path.sep) ? resolved : null;
};
