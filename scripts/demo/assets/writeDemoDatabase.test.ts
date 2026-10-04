/// <reference types="vite/client" />
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it } from "vitest";
import { z } from "zod";
import { migrations } from "../../../src/main/db/migrations/index";
import { buildDemoLibrary } from "./buildDemoLibrary/buildDemoLibrary.ts";
import type { DemoArtistSeed } from "./types.ts";
import { writeDemoDatabase } from "./writeDemoDatabase.ts";

const migrationsDir = path.join(
  import.meta.dirname,
  "../../../src/main/db/migrations",
);

const seeds: readonly DemoArtistSeed[] = [
  {
    name: "First Artist",
    genre: "Rock",
    startYear: 2000,
    albumCount: 2,
    playable: { albumIndex: 0, albumTitle: "Album", trackTitle: "Track" },
  },
  { name: "Second Artist", genre: "Jazz", startYear: 2010, albumCount: 1 },
];

const countRowSchema = z.object({ count: z.number() });
const versionRowSchema = z.object({ user_version: z.number() });
const modeRowSchema = z.object({ journal_mode: z.string() });
const pathRowSchema = z.object({ file_path: z.string() });

let tempDir: string;
let dbPath: string;

beforeEach(() => {
  tempDir = mkdtempSync(path.join(os.tmpdir(), "parade-demo-test-"));
  dbPath = path.join(tempDir, "app.db");
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

const read = <T>(query: (db: DatabaseSync) => T): T => {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try {
    return query(db);
  } finally {
    db.close();
  }
};

const count = (table: string): number =>
  read(
    (db) =>
      countRowSchema.parse(
        db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get(),
      ).count,
  );

// writeDemoDatabase cannot import the app's migration list (it is built
// from Vite raw imports), so it applies the directory in name order. This
// keeps the two in step: a script missing from the list, or listed in
// another order, fails here.
it("finds the same scripts in the same order as the app's migration list", () => {
  const files = readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort()
    .map((name) => readFileSync(path.join(migrationsDir, name), "utf-8"));

  expect(files).toEqual([...migrations]);
});

it("creates the database at the app's current schema version", () => {
  writeDemoDatabase({
    library: buildDemoLibrary(seeds),
    dbPath,
    migrationsDir,
  });

  expect(
    read((db) =>
      versionRowSchema.parse(db.prepare("PRAGMA user_version").get()),
    ).user_version,
  ).toBe(migrations.length);
});

it("leaves a single file without WAL side files", () => {
  writeDemoDatabase({
    library: buildDemoLibrary(seeds),
    dbPath,
    migrationsDir,
  });

  expect(
    read((db) => modeRowSchema.parse(db.prepare("PRAGMA journal_mode").get()))
      .journal_mode,
  ).toBe("delete");
  expect(readdirSync(tempDir)).toEqual(["app.db"]);
});

it("stores every track, cover, artist picture and playlist", () => {
  const library = buildDemoLibrary(seeds);
  const albums = library.artists.flatMap((artist) => artist.albums);
  writeDemoDatabase({ library, dbPath, migrationsDir });

  expect(count("musics")).toBe(
    albums.reduce((sum, album) => sum + album.tracks.length, 0),
  );
  expect(count("pictures")).toBe(albums.length + library.artists.length);
  expect(count("artist_pictures")).toBe(library.artists.length);
  expect(count("playlists")).toBe(library.playlists.length);
  expect(count("smart_playlists")).toBe(library.smartPlaylists.length);
});

it("stores paths relative to the assets directory", () => {
  writeDemoDatabase({
    library: buildDemoLibrary(seeds),
    dbPath,
    migrationsDir,
  });

  const paths = read((db) =>
    pathRowSchema
      .array()
      .parse(
        db
          .prepare(
            "SELECT file_path FROM musics UNION ALL SELECT file_path FROM pictures",
          )
          .all(),
      ),
  ).map((row) => row.file_path);
  for (const filePath of paths) {
    expect(filePath).toMatch(/^(musics|images)\//);
  }
});

it("replaces a database that already exists", () => {
  const library = buildDemoLibrary(seeds);
  writeDemoDatabase({ library, dbPath, migrationsDir });
  writeDemoDatabase({ library, dbPath, migrationsDir });

  expect(count("artist_pictures")).toBe(library.artists.length);
});
