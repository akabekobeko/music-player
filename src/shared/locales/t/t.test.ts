import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { dictionaries } from "../dictionaries";
import { resetMissingKeyLog } from "./resetMissingKeyLog";
import { t } from "./t";

beforeEach(() => {
  resetMissingKeyLog();
});

afterEach(() => {
  vi.restoreAllMocks();
});

it("returns the value from the requested locale when present", () => {
  expect(t("dialog.db.downgrade.title", "en")).toBe("Cannot Start");
  expect(t("dialog.db.downgrade.title", "ja")).toBe("起動できません");
});

it("falls back to English when the locale is missing the key", () => {
  // Sanity-check the production data path: English is the fallback floor.
  expect(t("app.name", "ja")).toBe(dictionaries.ja["app.name"]);
});

it("returns the key itself when no dictionary defines it", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  expect(t("does.not.exist", "en")).toBe("does.not.exist");
  expect(warn).toHaveBeenCalledTimes(1);
});

it("only warns once per missing key", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  t("missing.once", "ja");
  t("missing.once", "ja");
  t("missing.once", "en");
  expect(warn).toHaveBeenCalledTimes(1);
});
