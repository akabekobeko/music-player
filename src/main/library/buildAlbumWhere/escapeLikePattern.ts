/** Escape `%` / `_` / `\` so user text matches literally under `ESCAPE '\'`. */
export const escapeLikePattern = (text: string): string =>
  text.replace(/[\\%_]/g, (ch) => `\\${ch}`);
