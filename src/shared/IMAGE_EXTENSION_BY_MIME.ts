/**
 * File extension per supported image MIME type.
 *
 * Shared by both processes: Main derives artwork file names from it
 * (`artworkFileName`) and accept-lists user-selected images
 * (`onSetArtistPicture`, `mp:library:updateMusics`); Renderer rejects an
 * unsupported pick before it travels over IPC (music info dialog).
 */
export const IMAGE_EXTENSION_BY_MIME: Readonly<Record<string, string>> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/bmp": "bmp",
};
