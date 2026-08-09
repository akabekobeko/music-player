import { expandAudioPaths } from "../library/expandAudioPaths";
import type { ExpandPathsOk, ExpandPathsRequest, IpcResult } from "./types";
import { toIpcError } from "./utils/toIpcError";

/**
 * Channel handler for `mp:dnd:expandPaths`.
 *
 * Delegates to {@link expandAudioPaths} (queue-based walk, depth limit,
 * extension filter, symlink skip — `docs/specs/v1.0/features/library.md`).
 *
 * @param _ev - Electron event object (unused).
 * @param request - Dropped / selected paths to expand.
 * @returns The audio file paths found.
 */
export const onExpandPaths = async (
  _ev: Electron.IpcMainInvokeEvent,
  request: ExpandPathsRequest,
): Promise<IpcResult<ExpandPathsOk>> => {
  try {
    const files = await expandAudioPaths(request?.paths ?? []);
    return { ok: true, value: { files } };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  }
};
