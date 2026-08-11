import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { AppSettings, DeepPartial } from "../ipc/types";
import { DEFAULT_SETTINGS } from "./DEFAULT_SETTINGS";
import { mergeSettings } from "./mergeSettings";
import { sanitizeSettings } from "./sanitizeSettings";

/**
 * Owner of `<userData>/settings.json`. Main is the only process touching the
 * file (`docs/specs/v1.0/architecture/process-model.md`); the Renderer reads
 * and writes exclusively through `mp:settings:get` / `mp:settings:set`.
 *
 * Writes are debounced 500ms and performed atomically (tmp → rename) so a
 * crash mid-write can never leave a half-serialised file behind.
 */

/** Debounce window for persisting settings to disk. */
const SAVE_DELAY_MS = 500;

let filePath: string | null = null;
let current: AppSettings = DEFAULT_SETTINGS;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Serialise the current settings to disk atomically.
 *
 * Failures are logged and swallowed: settings persistence must never take
 * the app down, and the in-memory value stays authoritative for the session.
 */
const write = (): void => {
  if (filePath === null) {
    return;
  }

  try {
    mkdirSync(path.dirname(filePath), { recursive: true });
    const tmpPath = `${filePath}.tmp`;
    writeFileSync(tmpPath, `${JSON.stringify(current, null, 2)}\n`, "utf8");
    renameSync(tmpPath, filePath);
  } catch (error) {
    console.error("Failed to write settings file", error);
  }
};

/** Schedule a debounced {@link write}, restarting the countdown if pending. */
const scheduleSave = (): void => {
  if (saveTimer !== null) {
    clearTimeout(saveTimer);
  }

  saveTimer = setTimeout(() => {
    saveTimer = null;
    write();
  }, SAVE_DELAY_MS);
};

/**
 * Load `settings.json` synchronously and make it the in-memory settings.
 *
 * Call once at startup before any window is created (the theme decides the
 * title-bar overlay colors). A missing or broken file falls back to
 * {@link DEFAULT_SETTINGS} without failing startup.
 *
 * @param settingsFilePath - Absolute path of `settings.json`.
 * @returns The loaded (or default) settings.
 */
export const initializeSettings = (settingsFilePath: string): AppSettings => {
  filePath = settingsFilePath;
  try {
    current = sanitizeSettings(
      JSON.parse(readFileSync(settingsFilePath, "utf8")),
    );
  } catch {
    current = DEFAULT_SETTINGS;
  }

  return current;
};

/**
 * Read the settings currently in effect.
 *
 * @returns The in-memory settings snapshot.
 */
export const getSettings = (): AppSettings => current;

/**
 * Merge a patch into the settings and schedule persistence.
 *
 * @param patch - Deeply-partial patch from `mp:settings:set`.
 * @returns The merged settings — the single source of truth the Renderer
 * overwrites its state with.
 */
export const updateSettings = (
  patch: DeepPartial<AppSettings>,
): AppSettings => {
  current = mergeSettings(current, patch);
  scheduleSave();
  return current;
};

/**
 * Cancel any pending debounce and write synchronously.
 *
 * Call from `will-quit` so the last change is never lost to the 500ms
 * debounce window.
 */
export const flushSettings = (): void => {
  if (saveTimer !== null) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }

  write();
};

/**
 * Reset the module to its pristine state. Test helper only.
 */
export const resetSettingsForTest = (): void => {
  if (saveTimer !== null) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }

  filePath = null;
  current = DEFAULT_SETTINGS;
};
