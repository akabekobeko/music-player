import { app, Menu } from "electron";
import { resolveLocale } from "../../shared/locales/resolveLocale";
import { IpcKeys } from "../ipc/ipcKeys";
import type { MenuStateSnapshot } from "../ipc/types";
import { broadcast } from "../ipc/utils/broadcast";
import { getSettings } from "../settings/settingsManager";
import { buildMenuTemplate } from "./menuBuilder";

/**
 * Application-menu owner: holds the latest `mp:menu:setState` snapshot and
 * rebuilds the native menu whenever an input changes (startup, locale
 * change, state push). The template itself is the pure `menuBuilder`.
 */

/** Latest snapshot pushed by the Renderer. */
let currentState: MenuStateSnapshot = { isPlaying: false };

/**
 * Build and install the application menu from the current inputs.
 *
 * Call after settings are initialised, and again whenever the locale or the
 * menu state changes — `Menu.setApplicationMenu` replaces wholesale.
 */
export const installApplicationMenu = (): void => {
  const template = buildMenuTemplate({
    platform: process.platform,
    locale: resolveLocale({
      preference: getSettings().locale,
      systemLocale: app.getLocale(),
    }),
    appName: app.getName(),
    state: currentState,
    onAction: (action) => {
      broadcast(IpcKeys.MenuAction, { action });
    },
  });
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};

/**
 * Apply a `mp:menu:setState` push and rebuild.
 *
 * @param snapshot - Menu-relevant state from the Renderer.
 */
export const setMenuState = (snapshot: MenuStateSnapshot): void => {
  currentState = snapshot;
  installApplicationMenu();
};
