import type { AppSettings, DeepPartial } from "../ipc/types";
import { asFiniteNumber } from "./asFiniteNumber";
import { isLocalePreference } from "./isLocalePreference";
import { isThemePreference } from "./isThemePreference";
import { sanitizeAlbumFilter } from "./sanitizeAlbumFilter";
import { sanitizeSidebar } from "./sanitizeSidebar";

/**
 * Apply a `mp:settings:set` patch onto the current settings.
 *
 * Explicit-field strategy (never a generic deep merge — structural guard
 * against prototype pollution): every mergeable field is named here, invalid
 * patch values are ignored, and arrays replace wholesale.
 *
 * File I/O and debounce live in `settingsManager.ts`; keeping this half pure
 * makes the merge rules unit-testable without touching the filesystem.
 *
 * @param current - The settings in effect.
 * @param patch - Deeply-partial patch from the Renderer.
 * @returns The merged settings; `current` is not mutated.
 */
export const mergeSettings = (
  current: AppSettings,
  patch: DeepPartial<AppSettings>,
): AppSettings => {
  if (typeof patch !== "object" || patch === null) {
    return current;
  }

  const window = patch.window ?? {};
  const merged: AppSettings = {
    version: 1,
    window: {
      x: asFiniteNumber(window.x) ?? current.window.x,
      y: asFiniteNumber(window.y) ?? current.window.y,
      width: asFiniteNumber(window.width) ?? current.window.width,
      height: asFiniteNumber(window.height) ?? current.window.height,
      maximized:
        typeof window.maximized === "boolean"
          ? window.maximized
          : current.window.maximized,
    },
    ...(isLocalePreference(patch.locale)
      ? { locale: patch.locale }
      : current.locale !== undefined
        ? { locale: current.locale }
        : {}),
    ...(isThemePreference(patch.theme)
      ? { theme: patch.theme }
      : current.theme !== undefined
        ? { theme: current.theme }
        : {}),
  };

  const albumFilter =
    patch.albumFilter !== undefined
      ? sanitizeAlbumFilter(patch.albumFilter)
      : current.albumFilter;
  const sidebar =
    patch.sidebar !== undefined
      ? (sanitizeSidebar(patch.sidebar) ?? current.sidebar)
      : current.sidebar;
  return {
    ...merged,
    ...(albumFilter !== undefined ? { albumFilter } : {}),
    ...(sidebar !== undefined ? { sidebar } : {}),
  };
};
