import path from "node:path";

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
