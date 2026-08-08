import { expect, it } from "vitest";
import { resolveLocale } from "./resolveLocale";

it("prefers an explicit supported preference", () => {
  expect(resolveLocale({ preference: "ja", systemLocale: "en-US" })).toBe("ja");
});

it("falls through to the system locale when preference is system", () => {
  expect(resolveLocale({ preference: "system", systemLocale: "ja-JP" })).toBe(
    "ja",
  );
});

it("falls through to the system locale when preference is undefined", () => {
  expect(resolveLocale({ preference: undefined, systemLocale: "ja" })).toBe(
    "ja",
  );
});

it("normalises underscore-separated system locales", () => {
  expect(resolveLocale({ preference: undefined, systemLocale: "ja_JP" })).toBe(
    "ja",
  );
});

it("returns the fallback when the system locale is unsupported", () => {
  expect(resolveLocale({ preference: "system", systemLocale: "fr-FR" })).toBe(
    "en",
  );
});

it("returns the fallback when nothing is available", () => {
  expect(
    resolveLocale({ preference: undefined, systemLocale: undefined }),
  ).toBe("en");
});
