import { expect, it } from "vitest";
import { buildWindowBackgroundColor } from "./buildWindowBackgroundColor";

it("returns a dark color for the dark theme and a light one otherwise", () => {
  expect(buildWindowBackgroundColor(true)).toBe("#0a0a0a");
  expect(buildWindowBackgroundColor(false)).toBe("#ffffff");
});
