import { PictureKind } from "@akabeko/music-metadata-editor";
import { getDatabase } from "../db/connection";
import { deleteArtworkFiles } from "../library/deleteArtworkFiles";
import { getOrCreatePictureId } from "../library/getOrCreatePictureId";
import { IMAGE_EXTENSION_BY_MIME } from "../library/IMAGE_EXTENSION_BY_MIME";
import { saveArtwork } from "../library/saveArtwork";
import { setArtistPicture } from "../library/setArtistPicture";
import { imagesDirectory } from "../protocol/imagesDirectory";
import type {
  IpcResult,
  SetArtistPictureOk,
  SetArtistPictureRequest,
} from "./types";
import { toIpcError } from "./utils/toIpcError";

/**
 * Handler for `mp:library:setArtistPicture` — persist a user-selected image
 * into the artwork directory (content-hash dedup) and point the artist's
 * `artist_pictures` row at it. A picture orphaned by the swap is GC'd and
 * its file deleted.
 */
export const onSetArtistPicture = async (
  _ev: Electron.IpcMainInvokeEvent,
  request: SetArtistPictureRequest,
): Promise<IpcResult<SetArtistPictureOk>> => {
  try {
    if (request.data.byteLength === 0) {
      throw new Error("The selected image is empty.");
    }

    if (IMAGE_EXTENSION_BY_MIME[request.mimeType.toLowerCase()] === undefined) {
      throw new Error(`Unsupported image type: ${request.mimeType}`);
    }

    const picturePath = await saveArtwork(imagesDirectory(), {
      mimeType: request.mimeType,
      kind: PictureKind.Artist,
      data: request.data,
    });
    const db = getDatabase();
    const pictureId = getOrCreatePictureId(db, picturePath);
    const orphaned = setArtistPicture(db, request.artist, pictureId);
    await deleteArtworkFiles(orphaned);
    return { ok: true, value: { picturePath } };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  }
};
