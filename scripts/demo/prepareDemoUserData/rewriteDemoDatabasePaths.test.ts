import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it } from "vitest";
import { z } from "zod";
import { rewriteDemoDatabasePaths } from "./rewriteDemoDatabasePaths.ts";

const rowSchema = z.object({ file_path: z.string() });

let tempDir: string;
let dbPath: string;

beforeEach(() => {
  tempDir = mkdtempSync(path.join(os.tmpdir(), "parade-demo-test-"));
  dbPath = path.join(tempDir, "app.db");
  const db = new DatabaseSync(dbPath);
  db.exec("CREATE TABLE musics (file_path TEXT NOT NULL UNIQUE)");
  db.exec("CREATE TABLE pictures (file_path TEXT NOT NULL UNIQUE)");
  db.exec(
    "INSERT INTO musics (file_path) VALUES ('musics/Artist/Album/01 Title.m4a')",
  );
  db.exec("INSERT INTO pictures (file_path) VALUES ('images/albums/a.jpg')");
  db.close();
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

const readPaths = (table: string): string[] => {
  const db = new DatabaseSync(dbPath);
  try {
    return rowSchema
      .array()
      .parse(db.prepare(`SELECT file_path FROM ${table}`).all())
      .map((row) => row.file_path);
  } finally {
    db.close();
  }
};

it("prefixes music paths with the demo directory in platform notation", () => {
  rewriteDemoDatabasePaths(dbPath, tempDir);

  expect(readPaths("musics")).toEqual([
    path.join(tempDir, "musics", "Artist", "Album", "01 Title.m4a"),
  ]);
});

it("prefixes picture paths with the demo directory in platform notation", () => {
  rewriteDemoDatabasePaths(dbPath, tempDir);

  expect(readPaths("pictures")).toEqual([
    path.join(tempDir, "images", "albums", "a.jpg"),
  ]);
});
