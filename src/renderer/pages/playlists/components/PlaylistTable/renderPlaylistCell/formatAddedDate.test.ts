import { expect, it } from "vitest";
import { formatAddedDate } from "./formatAddedDate";

// No UTC designator: parsed as local time, so the date is the same in
// every time zone the tests run in.
const ISO = "2026-10-03T12:34:56";

it("formats the date without the time in the English style", () => {
  expect(formatAddedDate(ISO, "en")).toBe("Oct 3, 2026");
});

it("formats the date without the time in the Japanese style", () => {
  expect(formatAddedDate(ISO, "ja")).toBe("2026/10/03");
});

it("returns the raw string when it cannot be parsed", () => {
  expect(formatAddedDate("not a date", "en")).toBe("not a date");
});
