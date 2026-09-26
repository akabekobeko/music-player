import type { MusicPictureInput } from "@mp/ipc";

/**
 * Encode a fetched cover as a `data:` URL for `<img src>`
 * (`docs/specs/v1.2/features/artwork-compare.md`). A data URL rather than
 * a Blob URL so there is nothing to revoke; the bytes live only as long as
 * the dialog session. Encoded in chunks: `btoa` needs a binary string and
 * a spread of a multi-MB array would overflow the argument list.
 *
 * @param picture - The fetched image.
 * @returns The data URL.
 */
export const toDataUrl = (picture: MusicPictureInput): string => {
  const CHUNK = 0x8000;
  let binary = "";
  for (let offset = 0; offset < picture.data.length; offset += CHUNK) {
    binary += String.fromCharCode(
      ...picture.data.subarray(offset, offset + CHUNK),
    );
  }

  return `data:${picture.mimeType};base64,${btoa(binary)}`;
};
