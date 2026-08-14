/**
 * File extension per supported image MIME type.
 *
 * Shared by `artworkFileName` (name derivation) and
 * `onSetArtistPicture` (accept-list for user-selected images).
 */
export const IMAGE_EXTENSION_BY_MIME: Readonly<Record<string, string>> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/bmp": "bmp",
};
