import { expect, it } from "vitest";
import { resolveTheme } from "./theme";

it("returns an explicit light preference as-is", () => {
  expect(resolveTheme("light", true)).toBe("light");
});

it("returns an explicit dark preference as-is", () => {
  expect(resolveTheme("dark", false)).toBe("dark");
});

it("resolves system against the OS appearance", () => {
  expect(resolveTheme("system", true)).toBe("dark");
  expect(resolveTheme("system", false)).toBe("light");
});

it("treats an unset preference as system", () => {
  expect(resolveTheme(undefined, true)).toBe("dark");
  expect(resolveTheme(undefined, false)).toBe("light");
});
