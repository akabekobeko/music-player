import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { dictionaries } from "./dictionaries";
import { resetMissingKeyLog, t, tFor } from "./t";

beforeEach(() => {
  resetMissingKeyLog();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("t", () => {
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
});

describe("tFor", () => {
  it("substitutes {name} placeholders from params", () => {
    expect(
      tFor("en")("dialog.db.migrationFailed.message", { message: "disk full" }),
    ).toBe("Failed to update the library database: disk full");
    expect(
      tFor("ja")("dialog.db.downgrade.message", { appName: "Music Player" }),
    ).toBe(
      "ライブラリー データベースは新しいバージョンの Music Player で作成されています。アプリを更新してください。",
    );
  });

  it("leaves placeholders without a matching param untouched", () => {
    // `{message}` survives when the caller forgot to pass it — easier to spot
    // in the UI than a silent empty substring.
    expect(tFor("en")("dialog.db.migrationFailed.message")).toBe(
      "Failed to update the library database: {message}",
    );
  });
});

describe("dictionaries", () => {
  it("every locale defines the same key set", () => {
    const enKeys = Object.keys(dictionaries.en).sort();
    const jaKeys = Object.keys(dictionaries.ja).sort();
    expect(jaKeys).toEqual(enKeys);
  });
});
