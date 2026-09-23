import { type PictureInfo, PictureKind } from "@akabeko/music-metadata-editor";
import type { MusicPictureInput } from "../../ipc/types";
import { selectArtworkPicture } from "../selectArtworkPicture";

/**
 * Apply an artwork change to a track's embedded pictures
 * (`docs/specs/v1.1/architecture/metadata-write.md`, step 3).
 *
 * The representative picture (the one `selectArtworkPicture` shows as the
 * track's artwork) is removed; a replacement is inserted first as
 * `CoverFront`. Every other picture (back cover, leaflet, …) is kept.
 *
 * @param pictures - `Track.pictures` as loaded by mme.
 * @param picture - Replacement image, or `null` to remove the artwork.
 * @returns The picture list to hand to `saveTrack`.
 */
export const replaceArtwork = (
  pictures: readonly PictureInfo[],
  picture: MusicPictureInput | null,
): readonly PictureInfo[] => {
  const current = selectArtworkPicture(pictures);
  const rest = pictures.filter((candidate) => candidate !== current);
  if (picture === null) {
    return rest;
  }

  return [
    {
      mimeType: picture.mimeType,
      kind: PictureKind.CoverFront,
      data: picture.data,
    },
    ...rest,
  ];
};
