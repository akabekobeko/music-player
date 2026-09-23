import { DatabaseSync } from "node:sqlite";
import {
  PictureKind,
  type SavableTrack,
  type SaveTrackOptions,
  type Track,
} from "@akabeko/music-metadata-editor";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { runMigrations } from "../../db/runMigrations";
import type { UpdateProgressPayload } from "../../ipc/types";
import { getOrCreatePictureId } from "../getOrCreatePictureId";
import { upsertMusic } from "../musicRepository";
import { registerArtistPictureIfMissing } from "../registerArtistPictureIfMissing";
import type { MusicRowInput } from "../trackMapping";
import {
  runUpdateMusics,
  type UpdateRunDeps,
  type UpdateRunEvents,
} from "./runUpdateMusics";
import { TEMP_FILE_SUFFIX } from "./writeMusicFile";

let db: DatabaseSync;
/**
 * In-memory "disk": path → track, standing in for mme + fs. A written
 * track keeps its deletion markers (`null`) as mme's fake "reader" hands
 * them back unchanged, which `mapTrackToMusicRow` treats like unset.
 */
let files: Map<string, Track>;

beforeEach(() => {
  db = new DatabaseSync(":memory:");
  runMigrations(db);
  files = new Map();
});

afterEach(() => {
  db.close();
});

const track = (overrides: Partial<Track> = {}): Track => ({
  audioFormat: "mp3",
  durationMs: 1000,
  tag: { title: "Title", artist: "Artist", album: "Album", year: 2024 },
  pictures: [],
  chapters: [],
  additionalFields: {},
  warnings: [],
  ...overrides,
});

const row = (
  filePath: string,
  overrides: Partial<MusicRowInput> = {},
): MusicRowInput => ({
  filePath,
  audioFormat: "mp3",
  title: "Title",
  artist: "Artist",
  albumArtist: "",
  album: "Album",
  disc: 1,
  track: 0,
  year: 2024,
  genre: "",
  composer: "",
  lyricist: "",
  producer: "",
  conductor: "",
  publisher: "",
  durationMs: 1000,
  bpm: null,
  rating: null,
  ...overrides,
});

const NOW = "2026-09-23T00:00:00.000Z";

/** Register a track in the DB and on the fake disk; returns its id. */
const seed = (
  filePath: string,
  fileTrack: Track = track(),
  artworkPath?: string,
): number => {
  files.set(filePath, fileTrack);
  const pictureId =
    artworkPath !== undefined ? getOrCreatePictureId(db, artworkPath) : null;
  upsertMusic(db, row(filePath), NOW, pictureId);
  if (pictureId !== null) {
    registerArtistPictureIfMissing(db, "Artist", pictureId);
  }

  return (
    db.prepare("SELECT id FROM musics WHERE file_path = ?").get(filePath) as {
      id: number;
    }
  ).id;
};

/**
 * What a real reader would return for the written file: `null` markers are
 * gone (the field was removed). Kept as a cast so the expectations can still
 * inspect the markers the run wrote.
 */
const asTrack = (track: SavableTrack): Track => track as Track;

const notFound = (filePath: string): Error =>
  Object.assign(new Error(`ENOENT: ${filePath}`), { code: "ENOENT" });

const deps = (overrides: Partial<UpdateRunDeps> = {}): UpdateRunDeps => ({
  loadTrack: vi.fn(async (filePath: string) => {
    const found = files.get(filePath);
    if (found === undefined) {
      throw notFound(filePath);
    }

    return found;
  }),
  saveTrack: vi.fn(async (edited: SavableTrack, options: SaveTrackOptions) => {
    if (typeof options.source !== "string" || !files.has(options.source)) {
      throw notFound(String(options.source));
    }

    files.set(options.outputPath ?? options.source, asTrack(edited));
  }),
  rename: vi.fn(async (from: string, to: string) => {
    const moved = files.get(from);
    if (moved === undefined) {
      throw notFound(from);
    }

    files.delete(from);
    files.set(to, moved);
  }),
  unlink: vi.fn(async (filePath: string) => {
    files.delete(filePath);
  }),
  // Emulates content-hash naming: identical bytes → identical path.
  saveArtwork: vi.fn(async (picture) => `/images/${picture.data.join("")}.png`),
  now: () => "2027-01-01T00:00:00.000Z",
  ...overrides,
});

const events = (): UpdateRunEvents & { progress: UpdateProgressPayload[] } => {
  const progress: UpdateProgressPayload[] = [];
  return {
    progress,
    onProgress: (payload) => {
      progress.push(payload);
    },
  };
};

const dbRow = (id: number): Record<string, unknown> =>
  db.prepare("SELECT * FROM musics WHERE id = ?").get(id) as Record<
    string,
    unknown
  >;

it("writes the patch into the file and mirrors it into the DB", async () => {
  const id = seed("/m/a.mp3");

  const summary = await runUpdateMusics(
    db,
    {
      musicIds: [id],
      patch: { title: "Renamed", albumArtist: "AA", year: null },
    },
    events(),
    deps(),
  );

  expect(summary.failed).toEqual([]);
  // The fake keeps the patch as written; null is mme's deletion marker.
  expect(files.get("/m/a.mp3")?.tag).toEqual({
    title: "Renamed",
    artist: "Artist",
    albumArtist: "AA",
    album: "Album",
    year: null,
    recordingDate: null,
  });
  const after = dbRow(id);
  expect(after.title).toBe("Renamed");
  expect(after.album_artist).toBe("AA");
  expect(after.year).toBeNull();
  expect(after.added_at).toBe(NOW);
  expect(after.updated_at).toBe("2027-01-01T00:00:00.000Z");
});

it("returns the refreshed track with its display artist and album key", async () => {
  const id = seed("/m/a.mp3");

  const summary = await runUpdateMusics(
    db,
    { musicIds: [id], patch: { albumArtist: "Various", album: "Comp" } },
    events(),
    deps(),
  );

  expect(summary.updated).toHaveLength(1);
  const [updated] = summary.updated;
  expect(updated?.music.id).toBe(id);
  expect(updated?.music.albumArtist).toBe("Various");
  expect(updated?.displayArtist).toBe("Various");
  expect(updated?.albumKey).toBe("Various\u0000Comp");
});

it("processes every track serially and reports progress per file", async () => {
  const a = seed("/m/a.mp3");
  const b = seed("/m/b.mp3");
  const run = events();

  const summary = await runUpdateMusics(
    db,
    { musicIds: [a, b], patch: { genre: "Jazz" } },
    run,
    deps(),
  );

  expect(summary.updated.map((entry) => entry.music.id)).toEqual([a, b]);
  expect(run.progress).toEqual([
    { current: 1, total: 2, filePath: "/m/a.mp3" },
    { current: 2, total: 2, filePath: "/m/b.mp3" },
  ]);
  expect(dbRow(a).genre).toBe("Jazz");
  expect(dbRow(b).genre).toBe("Jazz");
});

it("aggregates a failed file without aborting the run", async () => {
  const good = seed("/m/good.mp3");
  const gone = seed("/m/gone.mp3");
  files.delete("/m/gone.mp3");
  const run = events();

  const summary = await runUpdateMusics(
    db,
    { musicIds: [gone, good], patch: { title: "Renamed" } },
    run,
    deps(),
  );

  expect(summary.updated.map((entry) => entry.music.id)).toEqual([good]);
  expect(summary.failed).toEqual([
    {
      musicId: gone,
      filePath: "/m/gone.mp3",
      error: { name: "Error", code: "ENOENT", message: "ENOENT: /m/gone.mp3" },
    },
  ]);
  expect(dbRow(gone).title).toBe("Title");
  expect(dbRow(good).title).toBe("Renamed");
  expect(run.progress.map((payload) => payload.current)).toEqual([1, 2]);
});

it("rejects unknown ids before touching any file", async () => {
  const id = seed("/m/a.mp3");
  const run = deps();

  await expect(
    runUpdateMusics(
      db,
      { musicIds: [id, 999], patch: { title: "Renamed" } },
      events(),
      run,
    ),
  ).rejects.toMatchObject({ code: "MUSIC_NOT_FOUND" });
  expect(run.saveTrack).not.toHaveBeenCalled();
  expect(dbRow(id).title).toBe("Title");
});

it("embeds a new front cover and points the row at the stored image", async () => {
  const id = seed("/m/a.mp3");
  const data = new Uint8Array([7, 7]);

  await runUpdateMusics(
    db,
    { musicIds: [id], patch: {}, picture: { mimeType: "image/png", data } },
    events(),
    deps(),
  );

  expect(files.get("/m/a.mp3")?.pictures).toEqual([
    { mimeType: "image/png", kind: PictureKind.CoverFront, data },
  ]);
  const picture = db
    .prepare(
      "SELECT p.file_path AS path FROM musics m JOIN pictures p ON p.id = m.picture_id WHERE m.id = ?",
    )
    .get(id) as { path: string };
  expect(picture.path).toBe("/images/77.png");
});

it("registers the artwork for a display artist that has none yet", async () => {
  const id = seed("/m/a.mp3");

  await runUpdateMusics(
    db,
    {
      musicIds: [id],
      patch: { albumArtist: "Newcomer" },
      picture: { mimeType: "image/png", data: new Uint8Array([1]) },
    },
    events(),
    deps(),
  );

  const artistPicture = db
    .prepare(
      "SELECT p.file_path AS path FROM artist_pictures a JOIN pictures p ON p.id = a.picture_id WHERE a.artist = ?",
    )
    .get("Newcomer") as { path: string } | undefined;
  expect(artistPicture?.path).toBe("/images/1.png");
});

it("does not overwrite an existing artist picture", async () => {
  const id = seed("/m/a.mp3", track(), "/images/old.png");

  await runUpdateMusics(
    db,
    {
      musicIds: [id],
      patch: {},
      picture: { mimeType: "image/png", data: new Uint8Array([2]) },
    },
    events(),
    deps(),
  );

  const artistPicture = db
    .prepare(
      "SELECT p.file_path AS path FROM artist_pictures a JOIN pictures p ON p.id = a.picture_id WHERE a.artist = ?",
    )
    .get("Artist") as { path: string };
  expect(artistPicture.path).toBe("/images/old.png");
});

it("removes the artwork and nulls picture_id even if a back cover remains", async () => {
  const front = {
    mimeType: "image/png",
    kind: PictureKind.CoverFront,
    data: new Uint8Array([1]),
  };
  const back = {
    mimeType: "image/png",
    kind: PictureKind.CoverBack,
    data: new Uint8Array([2]),
  };
  const id = seed(
    "/m/a.mp3",
    track({ pictures: [front, back] }),
    "/images/1.png",
  );
  const run = deps();

  await runUpdateMusics(
    db,
    { musicIds: [id], patch: {}, picture: null },
    events(),
    run,
  );

  expect(files.get("/m/a.mp3")?.pictures).toEqual([back]);
  expect(dbRow(id).picture_id).toBeNull();
  expect(run.saveArtwork).not.toHaveBeenCalled();
});

it("keeps the existing picture_id for a tag-only change of a file without artwork", async () => {
  const id = seed("/m/a.mp3", track(), "/images/keep.png");
  const before = dbRow(id).picture_id;

  await runUpdateMusics(
    db,
    { musicIds: [id], patch: { title: "Renamed" } },
    events(),
    deps(),
  );

  expect(dbRow(id).picture_id).toBe(before);
});

it("re-saves the file's own artwork on a tag-only change (content-hash dedup)", async () => {
  const front = {
    mimeType: "image/png",
    kind: PictureKind.CoverFront,
    data: new Uint8Array([3]),
  };
  const id = seed("/m/a.mp3", track({ pictures: [front] }), "/images/3.png");
  const run = deps();

  await runUpdateMusics(
    db,
    { musicIds: [id], patch: { title: "X" } },
    events(),
    run,
  );

  expect(run.saveArtwork).toHaveBeenCalledTimes(1);
  const picture = db
    .prepare(
      "SELECT p.file_path AS path FROM musics m JOIN pictures p ON p.id = m.picture_id WHERE m.id = ?",
    )
    .get(id) as { path: string };
  expect(picture.path).toBe("/images/3.png");
});

it("leaves no temporary file behind when the write fails", async () => {
  const id = seed("/m/a.mp3");
  const run = deps({
    saveTrack: vi.fn(
      async (edited: SavableTrack, options: SaveTrackOptions) => {
        files.set(options.outputPath ?? "", asTrack(edited));
        throw Object.assign(new Error("disk full"), { code: "ENOSPC" });
      },
    ),
  });

  const summary = await runUpdateMusics(
    db,
    { musicIds: [id], patch: { title: "Renamed" } },
    events(),
    run,
  );

  expect(summary.failed[0]?.error.code).toBe("ENOSPC");
  expect(files.has(`/m/a.mp3${TEMP_FILE_SUFFIX}`)).toBe(false);
  expect(files.get("/m/a.mp3")?.tag.title).toBe("Title");
  expect(dbRow(id).title).toBe("Title");
});

it("reports a DB failure after a successful file write as failed", async () => {
  const id = seed("/m/a.mp3");
  db.exec("DROP TABLE artist_pictures");

  const summary = await runUpdateMusics(
    db,
    {
      musicIds: [id],
      patch: {},
      picture: { mimeType: "image/png", data: new Uint8Array([5]) },
    },
    events(),
    deps(),
  );

  expect(summary.updated).toEqual([]);
  expect(summary.failed[0]?.musicId).toBe(id);
  expect(files.get("/m/a.mp3")?.pictures).toHaveLength(1);
});
