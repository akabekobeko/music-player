import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow, dialog, nativeTheme, screen } from "electron";
import { resolveLocale } from "../shared/locales/resolveLocale";
import { buildWindowChrome } from "./buildWindowChrome";
import { closeDatabase, openDatabase } from "./db/connection";
import { buildStartupErrorContent } from "./db/startupError";
import { applyTitleBarOverlayTheme } from "./ipc/applyTitleBarOverlayTheme";
import { initializeIpcEvents } from "./ipc/ipcHandler";
import { installApplicationMenu } from "./menu/applicationMenu";
// Importing also registers the privileged schemes (must run before `ready`).
import { registerProtocolHandlers } from "./protocol/registerProtocol";
import {
  flushSettings,
  getSettings,
  initializeSettings,
  updateSettings,
} from "./settings/settingsManager";
import { resolveWindowBounds } from "./windowState";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// This app does not use safeStorage, so prevent Chromium's cookie encryption
// from accessing the OS credential store and showing a permission dialog on
// startup. `use-mock-keychain` covers macOS (the `password-store` switch is
// Linux-only and has no effect there), while `password-store=basic` avoids the
// libsecret/kwallet backends on Linux.
app.commandLine.appendSwitch("use-mock-keychain");
app.commandLine.appendSwitch("password-store", "basic");

/**
 * Whether the dark palette is in effect right now, combining the persisted
 * preference with the OS theme for `"system"` (and unset).
 */
function shouldUseDarkTheme(): boolean {
  const theme = getSettings().theme;
  return (
    theme === "dark" ||
    ((theme === "system" || theme === undefined) &&
      nativeTheme.shouldUseDarkColors)
  );
}

/**
 * Persist the window's current geometry into the settings
 * (`docs/specs/v1.0/architecture/process-model.md`). Normal bounds are used
 * so un-maximizing later restores the pre-maximize rect; disk writes are
 * debounced by the settings manager.
 */
function saveWindowState(window: BrowserWindow): void {
  const bounds = window.getNormalBounds();
  updateSettings({
    window: { ...bounds, maximized: window.isMaximized() },
  });
}

function createWindow(): void {
  const saved = getSettings().window;
  const mainWindow = new BrowserWindow({
    ...resolveWindowBounds(
      saved,
      screen.getAllDisplays().map((display) => display.workArea),
    ),
    ...buildWindowChrome(process.platform, shouldUseDarkTheme()),
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  if (saved.maximized) {
    mainWindow.maximize();
  }

  for (const event of ["resized", "moved", "maximize", "unmaximize"] as const) {
    // biome-ignore lint/suspicious/noExplicitAny: the union of these event names does not narrow through `on` overloads; each one is a valid BrowserWindow event.
    mainWindow.on(event as any, () => {
      saveWindowState(mainWindow);
    });
  }

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  try {
    openDatabase(path.join(app.getPath("userData"), "app.db"));
  } catch (error) {
    // A broken or downgraded library DB means nothing else can work; tell
    // the user why and abort startup (docs/specs/v1.0/architecture/database.md).
    const locale = resolveLocale({
      preference: undefined,
      systemLocale: app.getLocale(),
    });
    const { title, message } = buildStartupErrorContent(error, locale);
    dialog.showErrorBox(title, message);
    app.quit();
    return;
  }

  initializeSettings(path.join(app.getPath("userData"), "settings.json"));
  registerProtocolHandlers();
  initializeIpcEvents();
  installApplicationMenu();
  createWindow();

  // Keep the WCO control colors in sync when the OS switches between light
  // and dark while the preference is "system" (explicit preferences are
  // handled inside the mp:settings:set handler).
  nativeTheme.on("updated", () => {
    applyTitleBarOverlayTheme(shouldUseDarkTheme());
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  app.quit();
});

app.on("will-quit", () => {
  flushSettings();
  closeDatabase();
});
