import path from "node:path";
import { AUDIO_FILE_EXTENSIONS } from "./AUDIO_FILE_EXTENSIONS";

/** Extension set for O(1) membership tests (lowercase, without the dot). */
const EXTENSION_SET: ReadonlySet<string> = new Set(AUDIO_FILE_EXTENSIONS);

/**
 * Whether a path points at a supported audio file, judged by extension.
 *
 * @param filePath - Absolute or relative file path.
 * @returns `true` when the extension (case-insensitive) is supported.
 */
export const isAudioFile = (filePath: string): boolean => {
  const extension = path.extname(filePath).slice(1).toLowerCase();
  return EXTENSION_SET.has(extension);
};
