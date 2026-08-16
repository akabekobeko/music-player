import { expect, it } from "vitest";
import { matchesTrackFilter } from "./matchesTrackFilter";

it("matches everything when the filter is blank", () => {
  expect(matchesTrackFilter("Anything", "")).toBe(true);
  expect(matchesTrackFilter("Anything", "   ")).toBe(true);
});

it("matches case-insensitive partial titles", () => {
  expect(matchesTrackFilter("Singin' in the Rain", "RAIN")).toBe(true);
  expect(matchesTrackFilter("Singin' in the Rain", "sun")).toBe(false);
});

it("trims the filter text before matching", () => {
  expect(matchesTrackFilter("Rainy Day", " rain ")).toBe(true);
});
