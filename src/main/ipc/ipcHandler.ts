import { ipcMain } from "electron";
import { IpcKeys } from "./ipcKeys";
import { onExpandPaths } from "./onExpandPaths";
import { onGetAlbums } from "./onGetAlbums";
import { onGetArtists } from "./onGetArtists";
import { onGetFilterOptions } from "./onGetFilterOptions";
import { onGetMusicsByAlbum } from "./onGetMusicsByAlbum";
import { onGetMusicsByArtist } from "./onGetMusicsByArtist";
import { onGetSettings } from "./onGetSettings";
import { onGetStats } from "./onGetStats";
import { onGetVersions } from "./onGetVersions";
import { onCancelImport, onImportMusics } from "./onImportMusics";
import { onMenuPopup } from "./onMenuPopup";
import { onMenuSetState } from "./onMenuSetState";
import { onOpenImportTargets } from "./onOpenImportTargets";
import { onPlaylistCreate } from "./onPlaylistCreate";
import { onPlaylistGetMusics } from "./onPlaylistGetMusics";
import { onPlaylistList } from "./onPlaylistList";
import { onPlaylistRemove } from "./onPlaylistRemove";
import { onPlaylistUpdate } from "./onPlaylistUpdate";
import { onRemoveMusics } from "./onRemoveMusics";
import { onSetArtistPicture } from "./onSetArtistPicture";
import { onSetSettings } from "./onSetSettings/onSetSettings";

/**
 * Tracks whether {@link initializeIpcEvents} has already wired the handlers.
 *
 * Guard against double registration when the function is called more than
 * once during app startup (e.g. in tests that re-create the main process).
 */
let isInitialized = false;

/**
 * Wire every implemented channel up to its handler.
 *
 * Idempotent: a second call after a successful initialisation is a no-op so
 * the function is safe to invoke from multiple lifecycle hooks (`whenReady`,
 * `activate`, …). Handlers for the remaining {@link IpcKeys} channels are
 * registered here as later phases implement them.
 *
 * @returns void.
 */
export const initializeIpcEvents = (): void => {
  if (isInitialized) {
    return;
  }

  isInitialized = true;
  ipcMain.handle(IpcKeys.GetVersions, onGetVersions);
  ipcMain.handle(IpcKeys.GetSettings, onGetSettings);
  ipcMain.handle(IpcKeys.SetSettings, onSetSettings);
  ipcMain.handle(IpcKeys.OpenImportTargets, onOpenImportTargets);
  ipcMain.handle(IpcKeys.ExpandPaths, onExpandPaths);
  ipcMain.handle(IpcKeys.ImportMusics, onImportMusics);
  ipcMain.handle(IpcKeys.CancelImport, onCancelImport);
  ipcMain.handle(IpcKeys.RemoveMusics, onRemoveMusics);
  ipcMain.handle(IpcKeys.GetArtists, onGetArtists);
  ipcMain.handle(IpcKeys.GetMusicsByArtist, onGetMusicsByArtist);
  ipcMain.handle(IpcKeys.GetAlbums, onGetAlbums);
  ipcMain.handle(IpcKeys.GetFilterOptions, onGetFilterOptions);
  ipcMain.handle(IpcKeys.GetStats, onGetStats);
  ipcMain.handle(IpcKeys.SetArtistPicture, onSetArtistPicture);
  ipcMain.handle(IpcKeys.GetMusicsByAlbum, onGetMusicsByAlbum);
  ipcMain.handle(IpcKeys.PlaylistList, onPlaylistList);
  ipcMain.handle(IpcKeys.PlaylistCreate, onPlaylistCreate);
  ipcMain.handle(IpcKeys.PlaylistUpdate, onPlaylistUpdate);
  ipcMain.handle(IpcKeys.PlaylistRemove, onPlaylistRemove);
  ipcMain.handle(IpcKeys.PlaylistGetMusics, onPlaylistGetMusics);
  ipcMain.on(IpcKeys.MenuSetState, onMenuSetState);
  ipcMain.on(IpcKeys.MenuPopup, onMenuPopup);
};

/**
 * Detach every handler registered by {@link initializeIpcEvents}.
 *
 * Useful for shutdown paths and for tests that need a clean slate between
 * cases.
 *
 * @returns void.
 */
export const releaseIpcEvents = (): void => {
  if (!isInitialized) {
    return;
  }

  ipcMain.removeHandler(IpcKeys.GetVersions);
  ipcMain.removeHandler(IpcKeys.GetSettings);
  ipcMain.removeHandler(IpcKeys.SetSettings);
  ipcMain.removeHandler(IpcKeys.OpenImportTargets);
  ipcMain.removeHandler(IpcKeys.ExpandPaths);
  ipcMain.removeHandler(IpcKeys.ImportMusics);
  ipcMain.removeHandler(IpcKeys.CancelImport);
  ipcMain.removeHandler(IpcKeys.RemoveMusics);
  ipcMain.removeHandler(IpcKeys.GetArtists);
  ipcMain.removeHandler(IpcKeys.GetMusicsByArtist);
  ipcMain.removeHandler(IpcKeys.GetAlbums);
  ipcMain.removeHandler(IpcKeys.GetFilterOptions);
  ipcMain.removeHandler(IpcKeys.GetStats);
  ipcMain.removeHandler(IpcKeys.SetArtistPicture);
  ipcMain.removeHandler(IpcKeys.GetMusicsByAlbum);
  ipcMain.removeHandler(IpcKeys.PlaylistList);
  ipcMain.removeHandler(IpcKeys.PlaylistCreate);
  ipcMain.removeHandler(IpcKeys.PlaylistUpdate);
  ipcMain.removeHandler(IpcKeys.PlaylistRemove);
  ipcMain.removeHandler(IpcKeys.PlaylistGetMusics);
  ipcMain.removeAllListeners(IpcKeys.MenuSetState);
  ipcMain.removeAllListeners(IpcKeys.MenuPopup);
  isInitialized = false;
};
