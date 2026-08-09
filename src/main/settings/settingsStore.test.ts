import { expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  mergeSettings,
  sanitizeSettings,
} from "./settingsStore";

it("returns defaults for non-object input", () => {
  expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS);
  expect(sanitizeSettings("broken")).toEqual(DEFAULT_SETTINGS);
  expect(sanitizeSettings(42)).toEqual(DEFAULT_SETTINGS);
});

it("keeps valid persisted fields", () => {
  const settings = sanitizeSettings({
    version: 1,
    window: { x: 10, y: 20, width: 1280, height: 800, maximized: true },
    locale: "ja",
    theme: "dark",
    albumFilter: { text: "abc", genres: ["Rock"], decades: [1990, null] },
  });
  expect(settings.window).toEqual({
    x: 10,
    y: 20,
    width: 1280,
    height: 800,
    maximized: true,
  });
  expect(settings.locale).toBe("ja");
  expect(settings.theme).toBe("dark");
  expect(settings.albumFilter).toEqual({
    text: "abc",
    genres: ["Rock"],
    decades: [1990, null],
  });
});

it("drops invalid fields and falls back to defaults", () => {
  const settings = sanitizeSettings({
    window: { width: "wide", height: Number.NaN, maximized: "yes" },
    locale: "fr",
    theme: "solarized",
    albumFilter: { text: 1, genres: "Rock" },
  });
  expect(settings.window).toEqual(DEFAULT_SETTINGS.window);
  expect(settings.locale).toBeUndefined();
  expect(settings.theme).toBeUndefined();
  expect(settings.albumFilter).toBeUndefined();
});

it("ignores unknown keys instead of persisting them", () => {
  const settings = sanitizeSettings({ __proto__: { polluted: true }, x: 1 });
  expect(settings).toEqual(DEFAULT_SETTINGS);
  expect(
    (settings as unknown as { polluted?: boolean }).polluted,
  ).toBeUndefined();
});

it("merges a partial window patch onto current values", () => {
  const merged = mergeSettings(DEFAULT_SETTINGS, {
    window: { width: 1440 },
  });
  expect(merged.window.width).toBe(1440);
  expect(merged.window.height).toBe(DEFAULT_SETTINGS.window.height);
  expect(merged.window.maximized).toBe(false);
});

it("merges theme and locale without touching other fields", () => {
  const current = { ...DEFAULT_SETTINGS, theme: "light" as const };
  const merged = mergeSettings(current, { theme: "dark" });
  expect(merged.theme).toBe("dark");
  expect(merged.window).toEqual(current.window);
});

it("keeps the current theme when the patch value is invalid", () => {
  const current = { ...DEFAULT_SETTINGS, theme: "dark" as const };
  const merged = mergeSettings(current, {
    theme: "neon" as unknown as "dark",
  });
  expect(merged.theme).toBe("dark");
});

it("replaces albumFilter wholesale", () => {
  const current = {
    ...DEFAULT_SETTINGS,
    albumFilter: { text: "old", genres: ["Jazz"] },
  };
  const merged = mergeSettings(current, {
    albumFilter: { genres: ["Rock"] },
  });
  expect(merged.albumFilter).toEqual({ genres: ["Rock"] });
});

it("does not mutate the current settings object", () => {
  const current = structuredClone(DEFAULT_SETTINGS);
  mergeSettings(current, { window: { width: 100 }, theme: "dark" });
  expect(current).toEqual(DEFAULT_SETTINGS);
});
