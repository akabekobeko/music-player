import { expect, it } from "vitest";
import { hasActiveFilter } from "./hasActiveFilter";

it("reports whether any filter kind is active", () => {
  expect(hasActiveFilter({})).toBe(false);
  expect(hasActiveFilter({ text: "a" })).toBe(true);
  expect(hasActiveFilter({ genres: ["Rock"] })).toBe(true);
  expect(hasActiveFilter({ decades: [null] })).toBe(true);
});
