import { expect, it } from "vitest";
import { formatReleaseDate } from "./formatDate";

it("formats the date in the long style of each locale", () => {
  expect(formatReleaseDate("en", "2026-10-03T12:34:56Z")).toBe(
    "October 3, 2026",
  );
  expect(formatReleaseDate("ja", "2026-10-03T12:34:56Z")).toBe("2026年10月3日");
});

it("keeps the UTC date regardless of the local time zone", () => {
  expect(formatReleaseDate("en", "2026-10-03T23:30:00Z")).toBe(
    "October 3, 2026",
  );
});
