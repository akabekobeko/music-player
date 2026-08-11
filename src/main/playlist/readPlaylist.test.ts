import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it } from "vitest";
import { runMigrations } from "../db/runMigrations";
import { getPlaylistMusics } from "./getPlaylistMusics";
import { removePlaylist } from "./removePlaylist";
import { updatePlaylist } from "./updatePlaylist";

let db: DatabaseSync;

beforeEach(() => {
  db = new DatabaseSync(":memory:");
  runMigrations(db);
});

afterEach(() => {
  db.close();
});

const NOW = "2026-08-10T00:00:00.000Z";

it("throws for unknown playlist ids", () => {
  expect(() => removePlaylist(db, { id: 99, kind: "static" })).toThrow(
    /not found/i,
  );
  expect(() =>
    updatePlaylist(db, { id: 99, kind: "smart", name: "X" }, NOW),
  ).toThrow(/not found/i);
  expect(() =>
    getPlaylistMusics(db, { playlistId: 99, kind: "static" }),
  ).toThrow(/not found/i);
});
