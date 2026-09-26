import type {
  IpcResult,
  LookupMusicRequest,
  MusicInfoCandidate,
} from "@mp/ipc";

/**
 * Look one track up on MusicBrainz through `mp:musicbrainz:lookupMusic`
 * for the music info dialog's fetch button. This wrapper only forwards
 * the request and hands the result back.
 *
 * @param request - The track to look up.
 * @returns The IPC result: the candidate, `null` for no match, or the error.
 */
export const lookupMusic = (
  request: LookupMusicRequest,
): Promise<IpcResult<MusicInfoCandidate | null>> =>
  window.mp.musicbrainz.lookupMusic(request);
