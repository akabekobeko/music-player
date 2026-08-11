import { beforeEach, expect, it } from "vitest";
import { resetMissingKeyLog } from "./resetMissingKeyLog";
import { tFor } from "./tFor";

beforeEach(() => {
  resetMissingKeyLog();
});

it("substitutes {name} placeholders from params via tFor", () => {
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
