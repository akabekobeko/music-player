import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, expect, it } from "vitest";
import { backupBeforeMigration } from "./backupBeforeMigration";

let tempDir: string | null = null;

afterEach(() => {
  if (tempDir !== null) {
    rmSync(tempDir, { recursive: true, force: true });
    tempDir = null;
  }
});

const makeTempDbPath = (): string => {
  tempDir = mkdtempSync(path.join(tmpdir(), "music-player-db-"));
  return path.join(tempDir, "app.db");
};

it("backs up the file when a migration would raise the version", () => {
  const filePath = makeTempDbPath();
  const db = new DatabaseSync(filePath);
  db.exec("PRAGMA user_version = 1");
  db.close();

  backupBeforeMigration(filePath, 2);

  expect(existsSync(`${filePath}.backup-v1`)).toBe(true);
});

it("does not back up an up-to-date file", () => {
  const filePath = makeTempDbPath();
  const db = new DatabaseSync(filePath);
  db.exec("PRAGMA user_version = 2");
  db.close();

  backupBeforeMigration(filePath, 2);

  expect(existsSync(`${filePath}.backup-v2`)).toBe(false);
});

it("does not back up a fresh (version 0) or missing file", () => {
  const filePath = makeTempDbPath();

  // Missing file: nothing to copy.
  expect(() => backupBeforeMigration(filePath, 2)).not.toThrow();

  const db = new DatabaseSync(filePath);
  db.close();
  backupBeforeMigration(filePath, 2);

  expect(existsSync(`${filePath}.backup-v0`)).toBe(false);
});
