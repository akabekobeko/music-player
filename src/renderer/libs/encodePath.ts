/**
 * Percent-encode an absolute path, keeping `/` separators.
 *
 * Each path segment is percent-encoded individually so separators survive
 * while `#`, `?`, and non-ASCII characters do not break the URL; Main
 * decodes the remainder with `decodeURIComponent`
 * (`src/main/protocol/urlToFilePath.ts`).
 */
export const encodePath = (filePath: string): string =>
  filePath.split("/").map(encodeURIComponent).join("/");
