import { expect, it } from "vitest";
import { DatabaseDowngradeError } from "./DatabaseDowngradeError";
import { buildStartupErrorContent } from "./startupError";

it("builds the downgrade dialog with the app name interpolated", () => {
  const content = buildStartupErrorContent(
    new DatabaseDowngradeError(2, 1),
    "en",
  );

  expect(content.title).toBe("Cannot Start");
  expect(content.message).toContain("Music Player");
  expect(content.message).toContain("newer version");
});

it("builds the generic dialog with the error message interpolated", () => {
  const content = buildStartupErrorContent(new Error("disk I/O error"), "en");

  expect(content.title).toBe("Database Error");
  expect(content.message).toContain("disk I/O error");
});

it("stringifies a non-Error value", () => {
  const content = buildStartupErrorContent("boom", "ja");

  expect(content.title).toBe("データベース エラー");
  expect(content.message).toContain("boom");
});
