/// <reference types="vite/client" />
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterAll, expect, it } from "vitest";
import { z } from "zod";
import { migrations } from "../../../src/main/db/migrations/index";
import { sanitizeSettings } from "../../../src/main/settings/sanitizeSettings";
import { buildDemoLibrary } from "./buildDemoLibrary/buildDemoLibrary.ts";

/**
 * Consistency checks of the committed demo data in `docs/demo/assets`
 * against the seed it is generated from. A failure here usually means the
 * seed changed without running `pnpm demo:assets` again.
 */

const root = path.join(import.meta.dirname, "../../..");
const assetsDir = path.join(root, "docs/demo/assets");
const library = buildDemoLibrary();
const db = new DatabaseSync(path.join(assetsDir, "app.db"), { readOnly: true });

const pathRowSchema = z.object({ file_path: z.string() });
const countRowSchema = z.object({ count: z.number() });
const versionRowSchema = z.object({ user_version: z.number() });

const readPaths = (table: string): string[] =>
  pathRowSchema
    .array()
    .parse(db.prepare(`SELECT file_path FROM ${table}`).all())
    .map((row) => row.file_path);

const count = (table: string): number =>
  countRowSchema.parse(
    db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get(),
  ).count;

afterAll(() => {
  db.close();
});

it("is not newer than the app's migrations", () => {
  const { user_version } = versionRowSchema.parse(
    db.prepare("PRAGMA user_version").get(),
  );

  expect(user_version).toBeGreaterThan(0);
  expect(user_version).toBeLessThanOrEqual(migrations.length);
});

it("holds the tracks of the seed library", () => {
  const tracks = library.artists.flatMap((artist) =>
    artist.albums.flatMap((album) => album.tracks),
  );

  expect(readPaths("musics").sort()).toEqual(
    tracks.map((track) => track.filePath).sort(),
  );
});

it("stores paths relative to the assets directory", () => {
  for (const filePath of [...readPaths("musics"), ...readPaths("pictures")]) {
    expect(path.isAbsolute(filePath)).toBe(false);
    expect(filePath).not.toContain("\\");
  }
});

it("has an image file for every picture row", () => {
  const missing = readPaths("pictures").filter(
    (filePath) => !existsSync(path.join(assetsDir, filePath)),
  );

  expect(missing).toEqual([]);
});

it("has no image file without a picture row", () => {
  const referenced = new Set(readPaths("pictures"));
  const files = ["images/albums", "images/artists"].flatMap((directory) =>
    readdirSync(path.join(assetsDir, directory))
      .filter((name) => !name.startsWith("."))
      .map((name) => `${directory}/${name}`),
  );

  expect(files.filter((file) => !referenced.has(file))).toEqual([]);
});

it("gives every artist a picture", () => {
  expect(count("artist_pictures")).toBe(library.artists.length);
});

it("has an audio file for the playable track only", () => {
  const existing = readPaths("musics").filter((filePath) =>
    existsSync(path.join(assetsDir, filePath)),
  );

  expect(existing).toEqual([library.playableTrack.filePath]);
});

it("holds the playlists of the seed library", () => {
  expect(count("playlists")).toBe(library.playlists.length);
  expect(count("playlist_musics")).toBe(
    library.playlists.reduce(
      (sum, playlist) => sum + playlist.tracks.length,
      0,
    ),
  );
  expect(count("smart_playlists")).toBe(library.smartPlaylists.length);
});

it("ships settings the app accepts as they are", () => {
  const settings = JSON.parse(
    readFileSync(path.join(assetsDir, "settings.json"), "utf-8"),
  );

  expect(sanitizeSettings(settings)).toEqual(settings);
});

it("opens on an artist that exists", () => {
  const settings = sanitizeSettings(
    JSON.parse(readFileSync(path.join(assetsDir, "settings.json"), "utf-8")),
  );

  expect(library.artists.map((artist) => artist.name)).toContain(
    settings.lastView?.artist,
  );
});
