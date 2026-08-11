import { type PictureInfo, PictureKind } from "@akabeko/music-metadata-editor";

/**
 * Pick the picture to use as a track's artwork.
 *
 * `CoverFront` wins; otherwise the first picture is used; no pictures means
 * no artwork.
 *
 * @param pictures - `Track.pictures` from mme.
 * @returns The chosen picture, or `null`.
 */
export const selectArtworkPicture = (
  pictures: readonly PictureInfo[],
): PictureInfo | null =>
  pictures.find((picture) => picture.kind === PictureKind.CoverFront) ??
  pictures[0] ??
  null;
