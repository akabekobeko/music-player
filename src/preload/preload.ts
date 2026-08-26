import { contextBridge, ipcRenderer, webUtils } from "electron";
import { IpcKeys } from "../main/ipc/ipcKeys";
import type {
  ImportProgressPayload,
  LibraryChangedPayload,
  MenuActionPayload,
  MpBridge,
  Unsubscribe,
} from "../main/ipc/types";

/**
 * Wrap `ipcRenderer.on` for a push channel and hand back the unsubscribe
 * function, so every `on*` bridge member fulfils the "subscriptions return
 * `() => void`" contract from `docs/specs/v1.0/architecture/ipc.md`.
 *
 * @param channel - Push channel name from {@link IpcKeys}.
 * @param listener - Renderer callback receiving the payload.
 * @returns Unsubscribe function detaching the wrapped listener.
 */
const subscribe = <T>(
  channel: string,
  listener: (payload: T) => void,
): Unsubscribe => {
  const wrapped = (_event: unknown, payload: T): void => listener(payload);
  ipcRenderer.on(channel, wrapped);
  return () => ipcRenderer.off(channel, wrapped);
};

/**
 * Build the `window.mp` bridge.
 *
 * Each verb forwards to `ipcRenderer.invoke(IpcKeys.X, args)`; `ipcRenderer`
 * itself is never exposed. The bridge type lives in `main/ipc/types.ts` so
 * this file and the Renderer's `vite-env.d.ts` agree on the shape without
 * sharing a runtime module. Handlers beyond `app.getVersions` are registered
 * on the Main side as later phases implement them.
 *
 * @returns The bridge object; assigned as the value of `window.mp`.
 */
const buildBridge = (): MpBridge => ({
  app: {
    getVersions: () => ipcRenderer.invoke(IpcKeys.GetVersions),
  },
  dialog: {
    openImportTargets: () => ipcRenderer.invoke(IpcKeys.OpenImportTargets),
  },
  dnd: {
    expandPaths: (request) => ipcRenderer.invoke(IpcKeys.ExpandPaths, request),
    pathFor: (file) => webUtils.getPathForFile(file),
  },
  library: {
    import: (request) => ipcRenderer.invoke(IpcKeys.ImportMusics, request),
    cancelImport: () => ipcRenderer.invoke(IpcKeys.CancelImport),
    removeMusics: (request) =>
      ipcRenderer.invoke(IpcKeys.RemoveMusics, request),
    removeArtist: (request) =>
      ipcRenderer.invoke(IpcKeys.RemoveArtist, request),
    removeAlbum: (request) => ipcRenderer.invoke(IpcKeys.RemoveAlbum, request),
    getArtists: () => ipcRenderer.invoke(IpcKeys.GetArtists),
    getMusicsByArtist: (request) =>
      ipcRenderer.invoke(IpcKeys.GetMusicsByArtist, request),
    getAlbums: (filter) => ipcRenderer.invoke(IpcKeys.GetAlbums, filter),
    getMusicsByAlbum: (request) =>
      ipcRenderer.invoke(IpcKeys.GetMusicsByAlbum, request),
    getFilterOptions: () => ipcRenderer.invoke(IpcKeys.GetFilterOptions),
    getStats: () => ipcRenderer.invoke(IpcKeys.GetStats),
    setArtistPicture: (request) =>
      ipcRenderer.invoke(IpcKeys.SetArtistPicture, request),
    setArtistInitial: (request) =>
      ipcRenderer.invoke(IpcKeys.SetArtistInitial, request),
    onImportProgress: (listener) =>
      subscribe<ImportProgressPayload>(IpcKeys.ImportProgress, listener),
    onChanged: (listener) =>
      subscribe<LibraryChangedPayload>(IpcKeys.LibraryChanged, listener),
  },
  playlist: {
    list: () => ipcRenderer.invoke(IpcKeys.PlaylistList),
    create: (request) => ipcRenderer.invoke(IpcKeys.PlaylistCreate, request),
    update: (request) => ipcRenderer.invoke(IpcKeys.PlaylistUpdate, request),
    remove: (request) => ipcRenderer.invoke(IpcKeys.PlaylistRemove, request),
    getMusics: (request) =>
      ipcRenderer.invoke(IpcKeys.PlaylistGetMusics, request),
  },
  settings: {
    get: () => ipcRenderer.invoke(IpcKeys.GetSettings),
    set: (request) => ipcRenderer.invoke(IpcKeys.SetSettings, request),
  },
  menu: {
    onAction: (listener) =>
      subscribe<MenuActionPayload>(IpcKeys.MenuAction, listener),
    setState: (snapshot) => ipcRenderer.send(IpcKeys.MenuSetState, snapshot),
    popup: (request) => ipcRenderer.send(IpcKeys.MenuPopup, request),
  },
  log: {
    forward: (request) => ipcRenderer.send(IpcKeys.LogForward, request),
  },
});

contextBridge.exposeInMainWorld("mp", buildBridge());
