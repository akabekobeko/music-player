import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow, dialog } from "electron";
import { resolveLocale } from "../shared/locales/resolveLocale";
import { closeDatabase, openDatabase } from "./db/connection";
import { buildStartupErrorContent } from "./db/startupError";
import { initializeIpcEvents } from "./ipc/ipcHandler";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// This app does not use safeStorage, so prevent Chromium's cookie encryption
// from accessing the OS credential store and showing a permission dialog on
// startup. `use-mock-keychain` covers macOS (the `password-store` switch is
// Linux-only and has no effect there), while `password-store=basic` avoids the
// libsecret/kwallet backends on Linux.
app.commandLine.appendSwitch("use-mock-keychain");
app.commandLine.appendSwitch("password-store", "basic");

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

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

  initializeIpcEvents();
  createWindow();

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
  closeDatabase();
});
