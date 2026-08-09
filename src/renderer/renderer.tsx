import type { AppSettings } from "@mp/ipc";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router";
import App from "./App";
import "./App.css";
import { libraryStore } from "./features/library/queryStore";
import { menuActionBus } from "./features/menu/menuActionBus";
import { SettingsProvider } from "./features/settings/SettingsProvider";
import {
  applyThemePreference,
  watchSystemTheme,
} from "./features/settings/theme";
import { detectPlatform } from "./libs/platform";

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

  window.mp.library.onChanged(() => {
    libraryStore.invalidate();
  });
  window.mp.menu.onAction(({ action }) => {
    menuActionBus.publish(action);
  });

  const root = document.getElementById("root");
  if (!root) {
    throw new Error("Root element not found");
  }

  createRoot(root).render(
    <StrictMode>
      <SettingsProvider initialSettings={settings}>
        <HashRouter>
          <App />
        </HashRouter>
      </SettingsProvider>
    </StrictMode>,
  );
};

void bootstrap();
