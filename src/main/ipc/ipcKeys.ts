/**
 * Channel name constants used by `ipcMain.handle` / `ipcRenderer.invoke`.
 *
 * Centralised here so Main and Preload reference the same string literals; if
 * a name needs to change, the type-checker forces every call site to follow.
 *
 * The `mp:<resource>:<verb>` shape keeps the names self-describing in
 * DevTools traces. See `docs/specs/v1.0/architecture/ipc.md` for the full
 * channel catalog.
 */
export const IpcKeys = {
  // Renderer → Main (invoke)
  GetVersions: "mp:app:getVersions",
  OpenImportTargets: "mp:dialog:openImportTargets",
  ExpandPaths: "mp:dnd:expandPaths",
  ImportMusics: "mp:library:import",
  CancelImport: "mp:library:cancelImport",
  RemoveMusics: "mp:library:removeMusics",
  GetArtists: "mp:library:getArtists",
  GetMusicsByArtist: "mp:library:getMusicsByArtist",
  GetAlbums: "mp:library:getAlbums",
  GetMusicsByAlbum: "mp:library:getMusicsByAlbum",
  GetFilterOptions: "mp:library:getFilterOptions",
  GetStats: "mp:library:getStats",
  SetArtistPicture: "mp:library:setArtistPicture",
  PlaylistList: "mp:playlist:list",
  PlaylistCreate: "mp:playlist:create",
  PlaylistUpdate: "mp:playlist:update",
  PlaylistRemove: "mp:playlist:remove",
  PlaylistGetMusics: "mp:playlist:getMusics",
  GetSettings: "mp:settings:get",
  SetSettings: "mp:settings:set",
  // Renderer → Main (send)
  LogForward: "mp:log:forward",
  MenuSetState: "mp:menu:setState",
  MenuPopup: "mp:menu:popup",
  // Main → Renderer (push)
  ImportProgress: "mp:library:importProgress",
  LibraryChanged: "mp:library:changed",
  MenuAction: "mp:menu:action",
} as const;

/** Union of every channel name declared in {@link IpcKeys}. */
export type IpcKey = (typeof IpcKeys)[keyof typeof IpcKeys];
