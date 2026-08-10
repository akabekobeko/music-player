import { getDatabase } from "../db/connection";
import { getLibraryStats } from "../library/statsQueries";
import type { IpcResult, LibraryStats } from "./types";
import { toIpcError } from "./utils/toIpcError";

/**
 * Channel handler for `mp:library:getStats`.
 *
 * @param _ev - Electron event object (unused).
 * @returns Library-wide counters for the settings page.
 */
export const onGetStats = async (
  _ev: Electron.IpcMainInvokeEvent,
): Promise<IpcResult<LibraryStats>> => {
  try {
    return { ok: true, value: getLibraryStats(getDatabase()) };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  }
};
