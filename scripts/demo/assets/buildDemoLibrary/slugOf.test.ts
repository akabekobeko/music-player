import { expect, it } from "vitest";
import { slugOf } from "./slugOf.ts";

it("joins lower-cased words with hyphens", () => {
  expect(slugOf("The Blue Lanterns")).toBe("the-blue-lanterns");
});

it("collapses symbols and trims the ends", () => {
  expect(slugOf("Alice & Bob (Live)")).toBe("alice-bob-live");
});

it("returns an empty string without ASCII letters or digits", () => {
  expect(slugOf("山田太郎")).toBe("");
});
