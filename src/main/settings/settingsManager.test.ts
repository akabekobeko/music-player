import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "./DEFAULT_SETTINGS";
import {
  flushSettings,
  getSettings,
  initializeSettings,
  resetSettingsForTest,
  updateSettings,
} from "./settingsManager";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), "mp-settings-"));
});

afterEach(() => {
  resetSettingsForTest();
  vi.useRealTimers();
  rmSync(dir, { recursive: true, force: true });
});

it("falls back to defaults when the file is missing", () => {
  const settings = initializeSettings(path.join(dir, "settings.json"));
  expect(settings).toEqual(DEFAULT_SETTINGS);
});

it("falls back to defaults when the file is broken JSON", () => {
  const file = path.join(dir, "settings.json");
  writeFileSync(file, "{ not json", "utf8");
  expect(initializeSettings(file)).toEqual(DEFAULT_SETTINGS);
});

it("loads and sanitizes an existing file", () => {
  const file = path.join(dir, "settings.json");
  writeFileSync(
    file,
    JSON.stringify({ theme: "dark", locale: "nope", window: { width: 1200 } }),
    "utf8",
  );
  const settings = initializeSettings(file);
  expect(settings.theme).toBe("dark");
  expect(settings.locale).toBeUndefined();
  expect(settings.window.width).toBe(1200);
  expect(settings.window.height).toBe(DEFAULT_SETTINGS.window.height);
});

it("updateSettings returns the merged snapshot and getSettings follows", () => {
  initializeSettings(path.join(dir, "settings.json"));
  const merged = updateSettings({ theme: "light" });
  expect(merged.theme).toBe("light");
  expect(getSettings()).toEqual(merged);
});

it("persists after the debounce window", () => {
  vi.useFakeTimers();
  const file = path.join(dir, "settings.json");
  initializeSettings(file);
  updateSettings({ theme: "dark" });
  updateSettings({ locale: "ja" });

  // Nothing on disk until the debounce fires; then a single combined write.
  expect(() => readFileSync(file, "utf8")).toThrow();
  vi.advanceTimersByTime(500);
  const persisted = JSON.parse(readFileSync(file, "utf8"));
  expect(persisted.theme).toBe("dark");
  expect(persisted.locale).toBe("ja");
});

it("flushSettings writes immediately and cancels the pending timer", () => {
  vi.useFakeTimers();
  const file = path.join(dir, "settings.json");
  initializeSettings(file);
  updateSettings({ theme: "dark" });
  flushSettings();
  const persisted = JSON.parse(readFileSync(file, "utf8"));
  expect(persisted.theme).toBe("dark");
});
