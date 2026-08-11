import { expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "./DEFAULT_SETTINGS";
import { mergeSettings } from "./mergeSettings";

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
