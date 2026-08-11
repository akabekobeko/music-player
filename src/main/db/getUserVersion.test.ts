import { DatabaseSync } from "node:sqlite";
import { afterEach, expect, it } from "vitest";
import { getUserVersion } from "./getUserVersion";

let db: DatabaseSync;

afterEach(() => {
  db.close();
});

it("reports 0 for a fresh database", () => {
  db = new DatabaseSync(":memory:");

  expect(getUserVersion(db)).toBe(0);
});

it("reports the stored user_version", () => {
  db = new DatabaseSync(":memory:");
  db.exec("PRAGMA user_version = 7");

  expect(getUserVersion(db)).toBe(7);
});
