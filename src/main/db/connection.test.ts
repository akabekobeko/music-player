import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, expect, it } from "vitest";
import {
  backupBeforeMigration,
  closeDatabase,
  getDatabase,
  openDatabase,
} from "./connection";
import { getUserVersion } from "./migrate";
import { migrations } from "./migrations";

let tempDir: string | null = null;

afterEach(() => {
  closeDatabase();
  if (tempDir !== null) {
    rmSync(tempDir, { recursive: true, force: true });
    tempDir = null;
  }
});

const makeTempDbPath = (): string => {
  tempDir = mkdtempSync(path.join(tmpdir(), "music-player-db-"));
  return path.join(tempDir, "app.db");
};

it("creates the v1 schema on open", () => {
  const db = openDatabase(":memory:");

  expect(getUserVersion(db)).toBe(migrations.length);
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE name = 'musics'")
    .get();
  expect(row).toBeDefined();
});

it("getDatabase returns the connection opened by openDatabase", () => {
  const db = openDatabase(":memory:");

  expect(getDatabase()).toBe(db);
});

it("getDatabase throws when nothing is open", () => {
  expect(() => getDatabase()).toThrow(/not open/);
});

it("openDatabase throws when a connection is already open", () => {
  openDatabase(":memory:");

  expect(() => openDatabase(":memory:")).toThrow(/already open/);
});

it("closeDatabase allows a subsequent openDatabase", () => {
  openDatabase(":memory:");
  closeDatabase();

  expect(() => openDatabase(":memory:")).not.toThrow();
});

it("enables foreign keys on the connection", () => {
  const db = openDatabase(":memory:");

  const row = db.prepare("PRAGMA foreign_keys").get() as {
    foreign_keys: number;
  };
  expect(row.foreign_keys).toBe(1);
});

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

it("persists the schema to a file database", () => {
  const filePath = makeTempDbPath();

  openDatabase(filePath);
  closeDatabase();

  const db = new DatabaseSync(filePath);
  expect(getUserVersion(db)).toBe(migrations.length);
  db.close();
});
