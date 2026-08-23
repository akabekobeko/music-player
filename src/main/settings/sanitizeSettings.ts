import type { AppSettings } from "../ipc/types";
import { asFiniteNumber } from "./asFiniteNumber";
import { DEFAULT_SETTINGS } from "./DEFAULT_SETTINGS";
import { isLocalePreference } from "./isLocalePreference";
import { isThemePreference } from "./isThemePreference";
import { sanitizeAlbumFilter } from "./sanitizeAlbumFilter";
import { sanitizeLastView } from "./sanitizeLastView";
import { sanitizeSidebar } from "./sanitizeSidebar";

/**
 * Validate raw JSON read from `settings.json` into an {@link AppSettings}.
 *
 * Field-by-field allowlist rather than a structural merge: unknown keys are
 * dropped and invalid values fall back to {@link DEFAULT_SETTINGS}, so a
 * corrupted or tampered file can never poison the in-memory settings.
 *
 * File I/O and debounce live in `settingsManager.ts`; keeping this half pure
 * makes the sanitize rules unit-testable without touching the filesystem.
 *
 * @param raw - Parsed JSON of unknown shape (or anything else).
 * @returns A valid settings object.
 */
export const sanitizeSettings = (raw: unknown): AppSettings => {
  if (typeof raw !== "object" || raw === null) {
    return DEFAULT_SETTINGS;
  }

  const source = raw as Record<string, unknown>;
  const window =
    typeof source.window === "object" && source.window !== null
      ? (source.window as Record<string, unknown>)
      : {};

  return {
    version: 1,
    window: {
      x: asFiniteNumber(window.x),
      y: asFiniteNumber(window.y),
      width: asFiniteNumber(window.width) ?? DEFAULT_SETTINGS.window.width,
      height: asFiniteNumber(window.height) ?? DEFAULT_SETTINGS.window.height,
      maximized:
        typeof window.maximized === "boolean" ? window.maximized : false,
    },
    ...(isLocalePreference(source.locale) ? { locale: source.locale } : {}),
    ...(isThemePreference(source.theme) ? { theme: source.theme } : {}),
    ...(sanitizeAlbumFilter(source.albumFilter)
      ? { albumFilter: sanitizeAlbumFilter(source.albumFilter) }
      : {}),
    ...(sanitizeSidebar(source.sidebar)
      ? { sidebar: sanitizeSidebar(source.sidebar) }
      : {}),
    ...(typeof source.importDialogPath === "string" &&
    source.importDialogPath !== ""
      ? { importDialogPath: source.importDialogPath }
      : {}),
    ...(sanitizeLastView(source.lastView)
      ? { lastView: sanitizeLastView(source.lastView) }
      : {}),
  };
};
