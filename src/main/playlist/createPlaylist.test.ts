import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it } from "vitest";
import { runMigrations } from "../db/runMigrations";
import { createPlaylist } from "./createPlaylist";

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

it("creates static playlists with incrementing sort order", () => {
  const first = createPlaylist(db, { kind: "static", name: "One" }, NOW);
  const second = createPlaylist(db, { kind: "static", name: "Two" }, NOW);

  expect(first).toEqual({ id: 1, kind: "static", name: "One", sortOrder: 0 });
  expect(second.sortOrder).toBe(1);
});

it("creates a smart playlist with its rules and rejects missing rules", () => {
  const smart = createPlaylist(
    db,
    { kind: "smart", name: "S", rules: RULES },
    NOW,
  );
  expect(smart).toEqual({
    id: 1,
    kind: "smart",
    name: "S",
    sortOrder: 0,
    rules: RULES,
  });

  expect(() => createPlaylist(db, { kind: "smart", name: "Bad" }, NOW)).toThrow(
    /rules/,
  );
});
