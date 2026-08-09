/**
 * Vitest stub for the `electron` module.
 *
 * Electron 42+ no longer downloads its prebuilt binary during `postinstall`;
 * it fetches it on the first `electron` bin launch instead. As a result,
 * importing the real `electron` module from a plain Node (Vitest) context
 * throws `ENOENT` while reading `path.txt` whenever the binary has not been
 * fetched yet (e.g. on a clean CI runner). Main-process unit tests run in
 * Node and never need the real runtime, so `vitest.config.ts` aliases
 * `electron` to this stub.
 *
 * The exported members mirror the API surface used under `src/main/`; every
 * call is an inert no-op returning a safe default. Extend it when a test
 * starts exercising a member that is not yet stubbed here.
 */

const noop = (): void => {};

/** Stub of Electron's `app` singleton. */
export const app = {
  isPackaged: false,
  name: "music-player",
  getName: (): string => "music-player",
  getVersion: (): string => "0.0.0-test",
  getLocale: (): string => "en-US",
  getPath: (): string => "",
  whenReady: (): Promise<void> => Promise.resolve(),
  on: noop,
  quit: noop,
  commandLine: {
    appendSwitch: noop,
  },
};

/** Stub of Electron's `BrowserWindow` static surface. */
export const BrowserWindow = {
  getAllWindows: (): unknown[] => [],
  getFocusedWindow: (): unknown => null,
  fromWebContents: (): unknown => null,
};

/** Stub of Electron's `nativeTheme`. */
export const nativeTheme = {
  shouldUseDarkColors: false,
  on: noop,
};

/** Stub of Electron's `dialog`. */
export const dialog = {
  showOpenDialog: (): Promise<{ canceled: boolean; filePaths: string[] }> =>
    Promise.resolve({ canceled: true, filePaths: [] }),
  showErrorBox: noop,
};

/** Stub of Electron's `ipcMain`. */
export const ipcMain = {
  handle: noop,
  on: noop,
  removeAllListeners: noop,
  removeHandler: noop,
};

/** Stub of Electron's `protocol`. */
export const protocol = {
  registerSchemesAsPrivileged: noop,
  handle: noop,
};

/** Stub of Electron's `net`. Tests spy on `fetch` to assert delegation. */
export const net = {
  fetch: (): Promise<Response> =>
    Promise.resolve(new Response(null, { status: 200 })),
};
