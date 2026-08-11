import { getDatabase } from "../db/connection";
import { getFilterOptions } from "../library/getFilterOptions";
import type { FilterOptions, IpcResult } from "./types";
import { toIpcError } from "./utils/toIpcError";

/**
 * Channel handler for `mp:library:getFilterOptions`.
 *
 * @param _ev - Electron event object (unused).
 * @returns Genre choices (with album counts) and the library year range.
 */
export const onGetFilterOptions = async (
  _ev: Electron.IpcMainInvokeEvent,
): Promise<IpcResult<FilterOptions>> => {
  try {
    return { ok: true, value: getFilterOptions(getDatabase()) };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  }
};
