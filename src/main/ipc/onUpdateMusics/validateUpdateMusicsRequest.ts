import { IMAGE_EXTENSION_BY_MIME } from "../../../shared/IMAGE_EXTENSION_BY_MIME";
import type { IpcError, UpdateMusicsRequest } from "../types";

/**
 * Validate a `mp:library:updateMusics` request before anything is written
 * (`docs/specs/v1.1/architecture/ipc-types.md`).
 *
 * Only structural problems are rejected here — an empty or duplicated id
 * list, a request that changes nothing, an unsupported or empty image. Ids
 * that are not in the library are caught by the run itself.
 *
 * @param request - Raw payload received over IPC.
 * @returns `null` when the request is acceptable, otherwise the error to
 *   return as `{ ok: false }`.
 */
export const validateUpdateMusicsRequest = (
  request: UpdateMusicsRequest | undefined,
): IpcError | null => {
  if (request === undefined || request === null) {
    return invalid("The request is missing.");
  }

  const { musicIds, patch, picture } = request;
  if (!Array.isArray(musicIds) || musicIds.length === 0) {
    return invalid("At least one music id is required.");
  }

  if (!musicIds.every((id) => Number.isInteger(id))) {
    return invalid("Music ids must be integers.");
  }

  if (new Set(musicIds).size !== musicIds.length) {
    return invalid("Music ids must not repeat.");
  }

  if (patch === undefined || patch === null || typeof patch !== "object") {
    return invalid("The patch is missing.");
  }

  if (Object.keys(patch).length === 0 && picture === undefined) {
    return invalid("The request changes nothing.");
  }

  if (picture !== undefined && picture !== null) {
    if (typeof picture.mimeType !== "string") {
      return invalid("The image MIME type is missing.");
    }

    if (IMAGE_EXTENSION_BY_MIME[picture.mimeType.toLowerCase()] === undefined) {
      return invalid(`Unsupported image type: ${picture.mimeType}`);
    }

    if (
      !(picture.data instanceof Uint8Array) ||
      picture.data.byteLength === 0
    ) {
      return invalid("The selected image is empty.");
    }
  }

  return null;
};

const invalid = (message: string): IpcError => ({
  name: "Error",
  code: "INVALID_REQUEST",
  message,
});
