import path from "node:path";

/**
 * MIME types of the audio formats the app imports
 * (`docs/specs/v1.0/architecture/tech-stack.md`). Hand-rolled instead of a
 * `mime-types` dependency — the served set is closed, so a lookup table is
 * enough.
 */
const AUDIO_CONTENT_TYPES: Readonly<Record<string, string>> = {
  ".mp3": "audio/mpeg",
  ".flac": "audio/flac",
  ".m4a": "audio/mp4",
  ".mp4": "audio/mp4",
  ".ogg": "audio/ogg",
  ".opus": "audio/ogg",
  ".wav": "audio/wav",
  ".aiff": "audio/aiff",
  ".aif": "audio/aiff",
  ".wma": "audio/x-ms-wma",
  ".ape": "audio/x-ape",
};

/**
 * Resolve the `Content-Type` for a served audio file from its extension.
 *
 * @param filePath - Path of the file being served.
 * @returns The audio MIME type, or `application/octet-stream` for unknown
 *   extensions.
 */
export const audioContentType = (filePath: string): string =>
  AUDIO_CONTENT_TYPES[path.extname(filePath).toLowerCase()] ??
  "application/octet-stream";
