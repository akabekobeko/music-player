/**
 * Make a title usable as a file or directory name on every platform.
 *
 * @param text - Artist name, album title or track title.
 * @returns The text with path separators and the characters Windows forbids
 *   replaced by `_`, without trailing dots or spaces.
 */
export const fileNameOf = (text: string): string =>
  text.replace(/[\\/:*?"<>|]/g, "_").replace(/[. ]+$/, "");
