import { getDatabase } from "../db/connection";
import {
  createPlaylist,
  getPlaylistMusics,
  listPlaylists,
  removePlaylist,
  updatePlaylist,
} from "../playlist/playlistQueries";
import type {
  IpcResult,
  Music,
  Playlist,
  PlaylistCreateRequest,
  PlaylistGetMusicsRequest,
  PlaylistRemoveRequest,
  PlaylistUpdateRequest,
} from "./types";
import { toIpcError } from "./utils/toIpcError";

/**
 * Channel handlers for the five `mp:playlist:*` channels. One file — the
 * handlers are thin request/response adapters over `playlistQueries` and
 * share nothing but the try/catch shape.
 */

/** Handler for `mp:playlist:list`. */
export const onPlaylistList = async (
  _ev: Electron.IpcMainInvokeEvent,
): Promise<IpcResult<readonly Playlist[]>> => {
  try {
    return { ok: true, value: listPlaylists(getDatabase()) };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  }
};

/** Handler for `mp:playlist:create`. */
export const onPlaylistCreate = async (
  _ev: Electron.IpcMainInvokeEvent,
  request: PlaylistCreateRequest,
): Promise<IpcResult<Playlist>> => {
  try {
    return {
      ok: true,
      value: createPlaylist(getDatabase(), request, new Date().toISOString()),
    };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  }
};

/** Handler for `mp:playlist:update`. */
export const onPlaylistUpdate = async (
  _ev: Electron.IpcMainInvokeEvent,
  request: PlaylistUpdateRequest,
): Promise<IpcResult<Playlist>> => {
  try {
    return {
      ok: true,
      value: updatePlaylist(getDatabase(), request, new Date().toISOString()),
    };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  }
};

/** Handler for `mp:playlist:remove`. */
export const onPlaylistRemove = async (
  _ev: Electron.IpcMainInvokeEvent,
  request: PlaylistRemoveRequest,
): Promise<IpcResult<void>> => {
  try {
    removePlaylist(getDatabase(), request);
    return { ok: true, value: undefined };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  }
};

/** Handler for `mp:playlist:getMusics`. */
export const onPlaylistGetMusics = async (
  _ev: Electron.IpcMainInvokeEvent,
  request: PlaylistGetMusicsRequest,
): Promise<IpcResult<readonly Music[]>> => {
  try {
    return { ok: true, value: getPlaylistMusics(getDatabase(), request) };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  }
};
