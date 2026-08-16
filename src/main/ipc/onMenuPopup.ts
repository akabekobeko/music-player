import { BrowserWindow, Menu } from "electron";
import type { MenuPopupRequest } from "./types";

/**
 * Channel handler for the `mp:menu:popup` send channel: open the application
 * menu as a dropdown anchored to the sender window — the Windows / Linux
 * menu button of the title-bar-less layout
 * (`docs/specs/v1.0/cross-platform/system-menu.md`).
 *
 * @param ev - Electron event object; identifies the requesting window.
 * @param request - Popup position in CSS pixels.
 */
export const onMenuPopup = (
  ev: Electron.IpcMainEvent,
  request: MenuPopupRequest,
): void => {
  const window = BrowserWindow.fromWebContents(ev.sender);
  const menu = Menu.getApplicationMenu();
  if (window === null || menu === null) {
    return;
  }

  // The payload crosses the IPC boundary unvalidated; coerce to finite
  // integers so a malformed request cannot reach the native popup call.
  const x = Number.isFinite(request?.x) ? Math.round(request.x) : 0;
  const y = Number.isFinite(request?.y) ? Math.round(request.y) : 0;
  menu.popup({ window, x, y });
};
