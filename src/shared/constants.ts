/**
 * Constants referenced as values from both the Main and Renderer processes.
 *
 * Keep this file dependency-free: only values that both tsconfig projects can
 * compile (no Node / DOM APIs) belong here.
 */

/** Display name of the application. */
export const APP_NAME = "Parade";

/**
 * Custom protocol scheme streaming audio files to the Renderer.
 * Used by both `<audio src>` and `fetch()`.
 */
export const PROTOCOL_MEDIA_STREAM = "media-stream";

/** Custom protocol scheme serving artwork images (`<img src>`). */
export const PROTOCOL_MEDIA_FILE = "media-file";
