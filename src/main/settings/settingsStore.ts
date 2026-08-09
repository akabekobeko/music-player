import type {
  AlbumFilter,
  AppSettings,
  DeepPartial,
  ThemePreference,
} from "../ipc/types";

/**
 * Pure logic for the persisted settings: defaults, validation of values read
 * from disk, and the explicit-field merge used by `mp:settings:set`.
 *
 * File I/O and debounce live in `settingsManager.ts`; keeping this half pure
 * makes the merge / sanitize rules unit-testable without touching the
 * filesystem.
 */

/** Settings used on first launch and as the fallback for a broken file. */
export const DEFAULT_SETTINGS: AppSettings = {
  version: 1,
  window: {
    width: 900,
    height: 670,
    maximized: false,
  },
};

/** Type guard for {@link ThemePreference} values. */
const isThemePreference = (value: unknown): value is ThemePreference =>
  value === "light" || value === "dark" || value === "system";

/** Type guard for the persisted locale preference. */
const isLocalePreference = (value: unknown): value is "en" | "ja" | "system" =>
  value === "en" || value === "ja" || value === "system";

/** Narrow an unknown to a finite number, or return `undefined`. */
const asFiniteNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

/**
 * Validate an unknown value as an {@link AlbumFilter}, dropping any field
 * that has the wrong shape.
 *
 * @param value - Raw `albumFilter` value from disk or a patch.
 * @returns A cleaned filter, or `undefined` when nothing valid remains.
 */
const sanitizeAlbumFilter = (value: unknown): AlbumFilter | undefined => {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const raw = value as Record<string, unknown>;
  const filter: {
    text?: string;
    genres?: string[];
    decades?: Array<number | null>;
  } = {};
  if (typeof raw.text === "string") {
    filter.text = raw.text;
  }

  if (Array.isArray(raw.genres)) {
    filter.genres = raw.genres.filter(
      (v): v is string => typeof v === "string",
    );
  }

  if (Array.isArray(raw.decades)) {
    filter.decades = raw.decades.filter(
      (v): v is number | null => v === null || asFiniteNumber(v) !== undefined,
    );
  }

  return Object.keys(filter).length > 0 ? filter : undefined;
};

/**
 * Validate raw JSON read from `settings.json` into an {@link AppSettings}.
 *
 * Field-by-field allowlist rather than a structural merge: unknown keys are
 * dropped and invalid values fall back to {@link DEFAULT_SETTINGS}, so a
 * corrupted or tampered file can never poison the in-memory settings.
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
  };
};

/**
 * Apply a `mp:settings:set` patch onto the current settings.
 *
 * Explicit-field strategy (never a generic deep merge — structural guard
 * against prototype pollution): every mergeable field is named here, invalid
 * patch values are ignored, and arrays replace wholesale.
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
  return albumFilter !== undefined ? { ...merged, albumFilter } : merged;
};
