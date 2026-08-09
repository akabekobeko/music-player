import { DatabaseSync } from "node:sqlite";
import type { Track } from "@akabeko/music-metadata-editor";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { runMigrations } from "../db/migrate";
import type { ImportProgressPayload } from "../ipc/types";
import {
  IMPORT_BATCH_SIZE,
  type ImportRunDeps,
  type ImportRunEvents,
  runImport,
} from "./importMusics";

let db: DatabaseSync;

beforeEach(() => {
  db = new DatabaseSync(":memory:");
  runMigrations(db);
});

afterEach(() => {
  db.close();
});

const track = (overrides: Partial<Track> = {}): Track => ({
  audioFormat: "mp3",
  durationMs: 1000,
  tag: { title: "Title", artist: "Artist" },
  pictures: [],
  chapters: [],
  additionalFields: {},
  warnings: [],
  ...overrides,
});

const deps = (overrides: Partial<ImportRunDeps> = {}): ImportRunDeps => ({
  loadTrack: vi.fn(async () => track()),
  expandAudioPaths: vi.fn(async (paths) => [...paths]),
  now: () => "2026-08-09T00:00:00.000Z",
  ...overrides,
});

const events = (
  overrides: Partial<ImportRunEvents> = {},
): ImportRunEvents & { progress: ImportProgressPayload[] } => {
  const progress: ImportProgressPayload[] = [];
  return {
    progress,
    onProgress: (payload) => {
      progress.push(payload);
    },
    isCancelled: () => false,
    ...overrides,
  };
};

const countRows = (): number =>
  (db.prepare("SELECT COUNT(*) AS n FROM musics").get() as { n: number }).n;

it("imports new files and reports them as imported", async () => {
  const summary = await runImport(
    db,
    ["/m/a.mp3", "/m/b.mp3"],
    events(),
    deps(),
  );
  expect(summary).toEqual({ imported: 2, updated: 0, failed: [] });
  expect(countRows()).toBe(2);
});

it("maps tag values into the row", async () => {
  await runImport(db, ["/m/a.mp3"], events(), deps());
  const row = db
    .prepare("SELECT title, artist, added_at, updated_at FROM musics")
    .get() as Record<string, string>;
  expect(row.title).toBe("Title");
  expect(row.artist).toBe("Artist");
  expect(row.added_at).toBe("2026-08-09T00:00:00.000Z");
});

it("re-import updates the row, keeping id and added_at", async () => {
  await runImport(db, ["/m/a.mp3"], events(), deps());
  const before = db.prepare("SELECT id, added_at FROM musics").get() as Record<
    string,
    unknown
  >;

  const summary = await runImport(
    db,
    ["/m/a.mp3"],
    events(),
    deps({
      loadTrack: vi.fn(async () => track({ tag: { title: "Renamed" } })),
      now: () => "2027-01-01T00:00:00.000Z",
    }),
  );
  expect(summary).toEqual({ imported: 0, updated: 1, failed: [] });

  const after = db
    .prepare("SELECT id, title, added_at, updated_at FROM musics")
    .get() as Record<string, unknown>;
  expect(after.id).toBe(before.id);
  expect(after.added_at).toBe(before.added_at);
  expect(after.title).toBe("Renamed");
  expect(after.updated_at).toBe("2027-01-01T00:00:00.000Z");
});

it("aggregates per-file failures without aborting the batch", async () => {
  const summary = await runImport(
    db,
    ["/m/bad.mp3", "/m/good.mp3"],
    events(),
    deps({
      loadTrack: vi.fn(async (filePath: string) => {
        if (filePath.includes("bad")) {
          throw new Error("broken header");
        }
        return track();
      }),
    }),
  );
  expect(summary.imported).toBe(1);
  expect(summary.failed).toEqual([
    {
      filePath: "/m/bad.mp3",
      error: { name: "Error", message: "broken header" },
    },
  ]);
  expect(countRows()).toBe(1);
});

it("pushes enumerating first, then importing progress per batch", async () => {
  const ev = events();
  const files = Array.from(
    { length: IMPORT_BATCH_SIZE + 1 },
    (_, i) => `/m/${String(i).padStart(4, "0")}.mp3`,
  );
  await runImport(db, files, ev, deps());

  expect(ev.progress[0]?.phase).toBe("enumerating");
  const importing = ev.progress.filter((p) => p.phase === "importing");
  // Initial 0-progress push + one per batch (2 batches for BATCH+1 files).
  expect(importing).toHaveLength(3);
  expect(importing[1]?.current).toBe(IMPORT_BATCH_SIZE);
  expect(importing[2]?.current).toBe(files.length);
  expect(importing[2]?.total).toBe(files.length);
});

it("cancellation stops at a file boundary and keeps committed rows", async () => {
  let cancelled = false;
  const files = Array.from(
    { length: IMPORT_BATCH_SIZE * 2 },
    (_, i) => `/m/${String(i).padStart(4, "0")}.mp3`,
  );
  const summary = await runImport(
    db,
    files,
    events({ isCancelled: () => cancelled }),
    deps({
      loadTrack: vi.fn(async (filePath: string) => {
        // Request cancellation while the first batch is being extracted.
        if (filePath.endsWith("0050.mp3")) {
          cancelled = true;
        }
        return track();
      }),
    }),
  );

  // The second batch never ran; the first batch's extracted rows committed.
  expect(summary.imported).toBeLessThan(files.length);
  expect(summary.imported).toBeGreaterThan(0);
  expect(countRows()).toBe(summary.imported);
});

it("expands directories via the enumeration seam", async () => {
  const expandAudioPaths = vi.fn(async () => ["/m/x.mp3"]);
  const summary = await runImport(
    db,
    ["/music-root"],
    events(),
    deps({ expandAudioPaths }),
  );
  expect(expandAudioPaths).toHaveBeenCalledWith(["/music-root"]);
  expect(summary.imported).toBe(1);
});

it("returns an empty summary for an empty expansion", async () => {
  const summary = await runImport(
    db,
    [],
    events(),
    deps({ expandAudioPaths: vi.fn(async () => []) }),
  );
  expect(summary).toEqual({ imported: 0, updated: 0, failed: [] });
});
