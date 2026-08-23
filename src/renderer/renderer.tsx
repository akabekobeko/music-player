import type { AppSettings } from "@mp/ipc";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router";
import App from "./App";
import "./App.css";
import { aboutStore } from "./features/about/aboutStore";
import { importStore } from "./features/import/importStore/importStore";
import { registerWindowDropHandler } from "./features/import/registerWindowDropHandler";
import { restoreLastView } from "./features/layout/lastView/restoreLastView";
import { sidebarStore } from "./features/layout/sidebarStore";
import { libraryStore } from "./features/library/queryStore/libraryStore";
import { menuActionBus } from "./features/menu/menuActionBus";
import { PlayerProvider } from "./features/player/PlayerProvider";
import { getActivePlayer } from "./features/player/playerBridge";
import { registerPlayerHotkeys } from "./features/player/registerPlayerHotkeys/registerPlayerHotkeys";
import { SettingsProvider } from "./features/settings/SettingsProvider";
import {
  applyThemePreference,
  watchSystemTheme,
} from "./features/settings/theme";
import { detectPlatform } from "./libs/platform";
import { albumFilterStore } from "./pages/albums/components/albumFilterStore";

/**
 * Fallback when `mp:settings:get` fails: the app still starts with defaults
 * (mirrors `DEFAULT_SETTINGS` on the Main side, which owns the real values).
 */
const FALLBACK_SETTINGS: AppSettings = {
  version: 1,
  window: { width: 900, height: 670, maximized: false },
};

/**
 * Load the persisted settings for the bootstrap.
 *
 * @returns Main's settings, or {@link FALLBACK_SETTINGS} when the IPC fails.
 */
const loadInitialSettings = async (): Promise<AppSettings> => {
  try {
    const result = await window.mp.settings.get();
    if (result.ok) {
      return result.value;
    }

    console.error("Failed to load settings", result.error);
  } catch (error) {
    console.error("Failed to load settings", error);
  }

  return FALLBACK_SETTINGS;
};

/**
 * App bootstrap (`docs/specs/v1.0/renderer/routing-layout.md`).
 *
 * Everything with app lifetime happens here, once, before `createRoot`:
 * initial settings, theme application, the OS theme watcher, and the
 * app-lifetime IPC push subscriptions. No unsubscribe is needed (same
 * lifetime as the page) and StrictMode double-invocation cannot duplicate
 * any of it.
 */
const bootstrap = async (): Promise<void> => {
  // Safe-area CSS fallbacks in App.css key off this attribute.
  document.documentElement.dataset.platform = detectPlatform(
    navigator.userAgent,
  );

  const settings = await loadInitialSettings();
  applyThemePreference(settings.theme);
  watchSystemTheme();
  albumFilterStore.initialize(settings.albumFilter);
  sidebarStore.initialize(settings.sidebar);
  await restoreLastView(settings.lastView);

  registerWindowDropHandler();
  registerPlayerHotkeys();

  window.mp.library.onChanged(() => {
    libraryStore.invalidate();
  });
  window.mp.library.onImportProgress((payload) => {
    importStore.handleProgress(payload);
  });
  window.mp.menu.onAction(({ action }) => {
    menuActionBus.publish(action);
  });
  // Route native menu actions to their targets (app-lifetime, like the
  // subscription above). Navigation uses the hash directly — the router is
  // a HashRouter and this runs outside the React tree.
  menuActionBus.subscribe((action) => {
    switch (action) {
      case "import":
        void importStore.openFromDialog();
        break;
      case "openSettings":
        window.location.hash = "#/settings";
        break;
      case "showAbout":
        aboutStore.open();
        break;
      case "stop":
        // Null-safe: the bridge is set once PlayerProvider mounts.
        getActivePlayer()?.commands.stop();
        break;
    }
  });

  const root = document.getElementById("root");
  if (!root) {
    throw new Error("Root element not found");
  }

  createRoot(root).render(
    <StrictMode>
      <SettingsProvider initialSettings={settings}>
        <PlayerProvider>
          <HashRouter>
            <App />
          </HashRouter>
        </PlayerProvider>
      </SettingsProvider>
    </StrictMode>,
  );
};

void bootstrap();
