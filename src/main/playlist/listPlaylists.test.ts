import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { runMigrations } from "../db/runMigrations";
import { createPlaylist } from "./createPlaylist";
import { listPlaylists } from "./listPlaylists";

let db: DatabaseSync;

beforeEach(() => {
  db = new DatabaseSync(":memory:");
  runMigrations(db);
});

afterEach(() => {
  db.close();
});

const NOW = "2026-08-10T00:00:00.000Z";

const RULES = {
  version: 1,
  match: "all",
  conditions: [{ field: "genre", operator: "is", value: "Rock" }],
} as const;

it("lists static playlists before smart ones, each by sort order", () => {
  createPlaylist(db, { kind: "smart", name: "S", rules: RULES }, NOW);
  createPlaylist(db, { kind: "static", name: "B" }, NOW);
  createPlaylist(db, { kind: "static", name: "A" }, NOW);

  expect(listPlaylists(db).map((entry) => [entry.kind, entry.name])).toEqual([
    ["static", "B"],
    ["static", "A"],
    ["smart", "S"],
  ]);
});

it("keeps a smart playlist whose stored rules are corrupted, without rules", () => {
  createPlaylist(db, { kind: "smart", name: "S", rules: RULES }, NOW);
  db.prepare(
    `INSERT INTO smart_playlists (id, name, rules, sort_order, created_at, updated_at)
     VALUES (9, 'Broken', '{"version":1,"match":"all"', 1, ?, ?)`,
  ).run(NOW, NOW);
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

  expect(listPlaylists(db)).toEqual([
    { id: 1, kind: "smart", name: "S", sortOrder: 0, rules: RULES },
    { id: 9, kind: "smart", name: "Broken", sortOrder: 1 },
  ]);
  expect(warn).toHaveBeenCalledOnce();
  warn.mockRestore();
});
