import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it } from "vitest";
import { z } from "zod";
import { prepareDemoUserData } from "./prepareDemoUserData.ts";

const rowSchema = z.object({ file_path: z.string() });

let tempDir: string;
let assetsDir: string;
let demoDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(path.join(os.tmpdir(), "parade-demo-test-"));
  assetsDir = path.join(tempDir, "assets");
  demoDir = path.join(tempDir, "userData", "demo");

  mkdirSync(path.join(assetsDir, "images"), { recursive: true });
  writeFileSync(path.join(assetsDir, "images", "a.jpg"), "image");
  writeFileSync(path.join(assetsDir, "settings.json"), '{"version":1}\n');
  writeFileSync(path.join(assetsDir, ".DS_Store"), "metadata");
  const db = new DatabaseSync(path.join(assetsDir, "app.db"));
  db.exec("CREATE TABLE musics (file_path TEXT NOT NULL UNIQUE)");
  db.exec("CREATE TABLE pictures (file_path TEXT NOT NULL UNIQUE)");
  db.exec("INSERT INTO pictures (file_path) VALUES ('images/a.jpg')");
  db.close();
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

it("copies the assets into the demo directory", () => {
  prepareDemoUserData({ assetsDir, demoDir });

  expect(readFileSync(path.join(demoDir, "images", "a.jpg"), "utf-8")).toBe(
    "image",
  );
  expect(readFileSync(path.join(demoDir, "settings.json"), "utf-8")).toBe(
    '{"version":1}\n',
  );
});

it("rewrites the database paths to the copied files", () => {
  prepareDemoUserData({ assetsDir, demoDir });

  const db = new DatabaseSync(path.join(demoDir, "app.db"));
  const rows = rowSchema
    .array()
    .parse(db.prepare("SELECT file_path FROM pictures").all());
  db.close();
  expect(rows.map((row) => row.file_path)).toEqual([
    path.join(demoDir, "images", "a.jpg"),
  ]);
  expect(existsSync(rows[0]?.file_path ?? "")).toBe(true);
});

it("leaves the committed assets untouched", () => {
  prepareDemoUserData({ assetsDir, demoDir });

  const db = new DatabaseSync(path.join(assetsDir, "app.db"));
  const rows = rowSchema
    .array()
    .parse(db.prepare("SELECT file_path FROM pictures").all());
  db.close();
  expect(rows.map((row) => row.file_path)).toEqual(["images/a.jpg"]);
});

it("removes whatever an earlier run left in the demo directory", () => {
  mkdirSync(path.join(demoDir, "Cache"), { recursive: true });
  writeFileSync(path.join(demoDir, "Cache", "stale"), "stale");

  prepareDemoUserData({ assetsDir, demoDir });

  expect(existsSync(path.join(demoDir, "Cache"))).toBe(false);
});

it("skips OS metadata files", () => {
  prepareDemoUserData({ assetsDir, demoDir });

  expect(existsSync(path.join(demoDir, ".DS_Store"))).toBe(false);
});

it("refuses a destination that is not named demo", () => {
  const userData = path.join(tempDir, "userData");
  mkdirSync(userData, { recursive: true });
  writeFileSync(path.join(userData, "app.db"), "library");

  expect(() => prepareDemoUserData({ assetsDir, demoDir: userData })).toThrow(
    "Refusing",
  );
  expect(readFileSync(path.join(userData, "app.db"), "utf-8")).toBe("library");
});

it("fails before removing anything when the assets are missing", () => {
  mkdirSync(demoDir, { recursive: true });
  writeFileSync(path.join(demoDir, "keep"), "keep");

  expect(() =>
    prepareDemoUserData({ assetsDir: path.join(tempDir, "nowhere"), demoDir }),
  ).toThrow("missing");
  expect(existsSync(path.join(demoDir, "keep"))).toBe(true);
});
