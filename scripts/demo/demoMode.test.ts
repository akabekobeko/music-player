/// <reference types="vite/client" />
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { afterAll, beforeAll, expect, it } from "vitest";
import { closeDatabase, openDatabase } from "../../src/main/db/connection";
import { getArtists } from "../../src/main/library/artistQueries";
import { getAlbums } from "../../src/main/library/getAlbums";
import { getFilterOptions } from "../../src/main/library/getFilterOptions";
import { getPlaylistMusics } from "../../src/main/playlist/getPlaylistMusics";
import { listPlaylists } from "../../src/main/playlist/listPlaylists";
import { isLibraryMusicPath } from "../../src/main/protocol/isLibraryMusicPath";
import { resolveImagePath } from "../../src/main/protocol/resolveImagePath";
import { prepareDemoUserData } from "./prepareDemoUserData/prepareDemoUserData.ts";

/**
 * End to end check of the demo mode without Electron: prepare the demo
 * directory from the committed assets the way `pnpm demo` does, then read it
 * through the app's own database code.
 */

let tempDir: string;
let demoDir: string;
let db: DatabaseSync;

beforeAll(() => {
  tempDir = mkdtempSync(path.join(os.tmpdir(), "parade-demo-test-"));
  demoDir = path.join(tempDir, "demo");
  prepareDemoUserData({
    assetsDir: path.join(import.meta.dirname, "../../docs/demo/assets"),
    demoDir,
  });
  db = openDatabase(path.join(demoDir, "app.db"));
});

afterAll(() => {
  closeDatabase();
  rmSync(tempDir, { recursive: true, force: true });
});

it("lists the artists with pictures the image protocol can serve", () => {
  const artists = getArtists(db);
  const imagesDir = path.join(demoDir, "images");

  expect(artists).toHaveLength(82);
  for (const artist of artists) {
    expect(
      resolveImagePath(artist.picturePath ?? "", imagesDir),
    ).not.toBeNull();
    expect(existsSync(artist.picturePath ?? "")).toBe(true);
  }
});

it("lists the albums with existing covers", () => {
  const albums = getAlbums(db, {});

  expect(albums).toHaveLength(346);
  for (const album of albums) {
    expect(existsSync(album.picturePath ?? "")).toBe(true);
  }
});

it("offers every genre, seven decades and unknown years in the album filter", () => {
  const options = getFilterOptions(db);

  expect(options.genres).toHaveLength(10);
  expect(options.decades.map((entry) => entry.decade)).toEqual([
    1960, 1970, 1980, 1990, 2000, 2010, 2020,
  ]);
  expect(options.unknownYearCount).toBe(2);
});

it("lists My Best and the genre smart playlists", () => {
  expect(
    listPlaylists(db).map((playlist) => [playlist.kind, playlist.name]),
  ).toEqual([
    ["static", "My Best"],
    ["smart", "Electronic"],
    ["smart", "Jazz"],
    ["smart", "Rock"],
  ]);
});

it("opens My Best with the playable track that the stream protocol serves", () => {
  const [myBest] = listPlaylists(db);
  const musics = getPlaylistMusics(db, {
    kind: "static",
    playlistId: myBest?.id ?? 0,
  });
  const first = musics[0];

  expect(musics).toHaveLength(20);
  expect(first?.title).toBe("Test Tone Serenade");
  expect(isLibraryMusicPath(db, first?.filePath ?? "")).toBe(true);
  expect(existsSync(first?.filePath ?? "")).toBe(true);
});

it("puts the playable track on the first row of its genre smart playlist", () => {
  const electronic = listPlaylists(db).find(
    (playlist) => playlist.kind === "smart" && playlist.name === "Electronic",
  );
  const musics = getPlaylistMusics(db, {
    kind: "smart",
    playlistId: electronic?.id ?? 0,
  });

  expect(musics[0]?.title).toBe("Test Tone Serenade");
  expect(musics.every((music) => music.genre === "Electronic")).toBe(true);
  expect(existsSync(musics[0]?.filePath ?? "")).toBe(true);
});
