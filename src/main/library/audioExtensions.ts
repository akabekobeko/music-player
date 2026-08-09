import path from "node:path";

/**
 * Audio file extensions accepted by the importer — mme core's supported
 * range (`docs/specs/v1.0/features/library.md`). Shared by the import
 * dialog's filter and the drag & drop path expansion so the two entrances
 * can never diverge.
 */
export const AUDIO_FILE_EXTENSIONS = [
  "mp3",
  "flac",
  "m4a",
  "mp4",
  "ogg",
  "opus",
  "wav",
  "aiff",
  "aif",
  "wma",
  "ape",
] as const;

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
