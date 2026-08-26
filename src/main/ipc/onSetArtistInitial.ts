import { getDatabase } from "../db/connection";
import { setArtistInitial } from "../library/setArtistInitial";
import type { IpcResult, SetArtistInitialRequest } from "./types";
import { toIpcError } from "./utils/toIpcError";

/**
 * Handler for `mp:library:setArtistInitial` — store a user-chosen initial
 * (A–Z) for an artist in `artist_initials`, or clear it (`null`, "Other")
 * so the artist list falls back to the automatic classification.
 *
 * @param _ev - Electron event object (unused).
 * @param request - Artist and the initial to store or clear.
 * @returns `ok` on success.
 */
export const onSetArtistInitial = async (
  _ev: Electron.IpcMainInvokeEvent,
  request: SetArtistInitialRequest,
): Promise<IpcResult<void>> => {
  try {
    setArtistInitial(getDatabase(), request.artist, request.initial);
    return { ok: true, value: undefined };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  }
};
