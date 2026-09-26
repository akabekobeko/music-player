import { getDatabase } from "../db/connection";
import { getMusicsByIds } from "../library/getMusicsByIds";
import { lookupMusicInfo } from "../musicbrainz/lookupMusicInfo/lookupMusicInfo";
import { musicBrainzClient } from "../musicbrainz/musicBrainzClient";
import type {
  IpcResult,
  LookupMusicRequest,
  MusicInfoCandidate,
} from "./types";
import { toIpcError } from "./utils/toIpcError";

/**
 * Channel handler for `mp:musicbrainz:lookupMusic`
 * (`docs/specs/v1.2/architecture/ipc.md`): the music info dialog's fetch
 * button. Looks one track up through the shared client (so it queues
 * behind a running bulk fetch and the rate limit still holds).
 *
 * "Not found" is a result (`ok: true, value: null`), not an error. The
 * outer result is `ok: false` for an invalid or unknown id and for a
 * failed request, whose MusicBrainz code travels as `IpcError.code` so
 * the dialog can pick its wording.
 *
 * @param _ev - Electron event object (unused).
 * @param request - The track to look up.
 * @returns The candidate, `null`, or the failure.
 */
export const onLookupMusic = async (
  _ev: Electron.IpcMainInvokeEvent,
  request: LookupMusicRequest,
): Promise<IpcResult<MusicInfoCandidate | null>> => {
  const musicId = request?.musicId;
  if (!Number.isInteger(musicId)) {
    return {
      ok: false,
      error: {
        name: "Error",
        code: "INVALID_REQUEST",
        message: "The music id must be an integer.",
      },
    };
  }

  try {
    const music = getMusicsByIds(getDatabase(), [musicId])[0];
    if (music === undefined) {
      return {
        ok: false,
        error: {
          name: "Error",
          code: "MUSIC_NOT_FOUND",
          message: `Unknown music id: ${musicId}`,
        },
      };
    }

    const result = await lookupMusicInfo(musicBrainzClient, music);
    if (!result.ok) {
      return {
        ok: false,
        error: {
          name: "MusicBrainzError",
          code: result.error.code,
          message: result.error.message,
        },
      };
    }

    return { ok: true, value: result.value };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  }
};
