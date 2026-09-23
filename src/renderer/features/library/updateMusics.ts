import type {
  IpcResult,
  UpdateMusicsRequest,
  UpdateMusicsSummary,
} from "@mp/ipc";

/**
 * Write a tag / artwork change to tracks through
 * `mp:library:updateMusics`. Progress arrives through `updateProgressStore`
 * and the library views refresh through the `mp:library:changed` push, so
 * this wrapper only forwards the request and hands the summary back.
 *
 * @param request - Tracks to update plus the change to apply.
 * @returns The IPC result: the per-track summary, or the validation error.
 */
export const updateMusics = (
  request: UpdateMusicsRequest,
): Promise<IpcResult<UpdateMusicsSummary>> =>
  window.mp.library.updateMusics(request);
