import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { runMigrations } from "../../db/runMigrations";
import type {
  FetchProgressPayload,
  Music,
  MusicInfoCandidate,
  UpdateMusicsRequest,
} from "../../ipc/types";
import { getMusicsByIds } from "../../library/getMusicsByIds";
import { upsertMusic } from "../../library/musicRepository";
import type { MusicRowInput } from "../../library/trackMapping";
import { readFixture } from "../fixtures/readFixture";
import { lookupAlbumGroup } from "../lookupMusicInfo/lookupAlbumGroup";
import { MusicBrainzClient } from "../MusicBrainzClient/MusicBrainzClient";
import type { MusicBrainzResult } from "../types";
import {
  type FetchRunDeps,
  type FetchRunEvents,
  runFetchMusicInfo,
} from "./runFetchMusicInfo";

let db: DatabaseSync;

beforeEach(() => {
  db = new DatabaseSync(":memory:");
  runMigrations(db);
});

afterEach(() => {
  db.close();
});

const NOW = "2026-09-26T00:00:00.000Z";

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
  year: null,
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

/** Register a track and return its id. */
const seed = (
  filePath: string,
  overrides: Partial<MusicRowInput> = {},
): number => {
  upsertMusic(db, row(filePath, overrides), NOW, null);
  return (
    db.prepare("SELECT id FROM musics WHERE file_path = ?").get(filePath) as {
      id: number;
    }
  ).id;
};

const candidate = (
  tags: Partial<MusicInfoCandidate["tags"]> = {},
): MusicInfoCandidate => ({
  recordingId: "r",
  releaseId: "rel",
  score: 100,
  tags: {
    title: null,
    artist: null,
    albumArtist: null,
    album: null,
    genre: "Rock",
    year: 2007,
    track: null,
    disc: null,
    composer: null,
    lyricist: null,
    producer: null,
    conductor: null,
    publisher: null,
    ...tags,
  },
  picture: null,
});

const ok = (
  value: MusicInfoCandidate | null,
): MusicBrainzResult<MusicInfoCandidate | null> => ({
  ok: true,
  value,
});

/** Fake lookup: answers per music id; unknown ids are "not found". */
const lookupWith =
  (
    answers: Readonly<
      Record<number, MusicBrainzResult<MusicInfoCandidate | null>>
    >,
  ): FetchRunDeps["lookupAlbumGroup"] =>
  async (musics) =>
    new Map(musics.map((music) => [music.id, answers[music.id] ?? ok(null)]));

/** Fake write: reports every request as updated with the current row. */
const updateOk: FetchRunDeps["updateMusics"] = async (database, request) => {
  const music = getMusicsByIds(database, request.musicIds)[0] as Music;
  return {
    updated: [{ music, displayArtist: music.artist, albumKey: "k" }],
    failed: [],
  };
};

const events = (
  controller = new AbortController(),
): FetchRunEvents & { readonly pushes: FetchProgressPayload[] } => {
  const pushes: FetchProgressPayload[] = [];
  return {
    pushes,
    onProgress: (payload) => {
      pushes.push(payload);
    },
    signal: controller.signal,
  };
};

it("classifies every track and pushes one progress per track", async () => {
  const a = seed("/a.mp3");
  const b = seed("/b.mp3", { genre: "Jazz", year: 1999 });
  const c = seed("/c.mp3");
  const d = seed("/d.mp3");
  const writes: UpdateMusicsRequest[] = [];
  const ev = events();

  const summary = await runFetchMusicInfo(
    db,
    { musicIds: [a, b, c, d, 999] },
    ev,
    {
      lookupAlbumGroup: lookupWith({
        [a]: ok(candidate()),
        [b]: ok(candidate()),
        [d]: { ok: false, error: { code: "MB_TIMEOUT", message: "slow" } },
      }),
      updateMusics: async (database, request) => {
        writes.push(request);
        return updateOk(database, request);
      },
    },
  );

  expect(summary.updated.map((entry) => entry.music.id)).toEqual([a]);
  expect(summary.unchanged.map((entry) => entry.musicId)).toEqual([b]);
  expect(summary.notFound.map((entry) => entry.musicId)).toEqual([c]);
  expect(
    summary.failed.map((entry) => [entry.musicId, entry.error.code]),
  ).toEqual([
    [999, "MUSIC_NOT_FOUND"],
    [d, "MB_TIMEOUT"],
  ]);
  expect(summary.cancelled).toBe(false);
  expect(writes).toEqual([
    { musicIds: [a], patch: { genre: "Rock", year: 2007 } },
  ]);
  expect(
    ev.pushes.map((push) => [push.current, push.total, push.result]),
  ).toEqual([
    [1, 4, "updated"],
    [2, 4, "unchanged"],
    [3, 4, "notFound"],
    [4, 4, "failed"],
  ]);
});

it("looks up each album group once, in first-appearance order", async () => {
  const a = seed("/a.mp3", { album: "X" });
  const b = seed("/b.mp3", { album: "Y" });
  const c = seed("/c.mp3", { album: "X" });
  const groups: number[][] = [];

  await runFetchMusicInfo(db, { musicIds: [a, b, c] }, events(), {
    lookupAlbumGroup: async (musics) => {
      groups.push(musics.map((music) => music.id));
      return new Map();
    },
    updateMusics: updateOk,
  });

  expect(groups).toEqual([[a, c], [b]]);
});

it("records a write failure under the track and keeps going", async () => {
  const a = seed("/a.mp3");
  const b = seed("/b.mp3");

  const summary = await runFetchMusicInfo(db, { musicIds: [a, b] }, events(), {
    lookupAlbumGroup: lookupWith({
      [a]: ok(candidate()),
      [b]: ok(candidate()),
    }),
    updateMusics: async (database, request) =>
      request.musicIds[0] === a
        ? {
            updated: [],
            failed: [
              {
                musicId: a,
                filePath: "/a.mp3",
                error: { name: "Error", code: "EACCES", message: "denied" },
              },
            ],
          }
        : updateOk(database, request),
  });

  expect(summary.failed.map((entry) => entry.error.code)).toEqual(["EACCES"]);
  expect(summary.updated.map((entry) => entry.music.id)).toEqual([b]);
});

it("stops at the next track boundary after a cancel, keeping what was written", async () => {
  const a = seed("/a.mp3", { album: "X" });
  const b = seed("/b.mp3", { album: "X" });
  const c = seed("/c.mp3", { album: "Y" });
  const controller = new AbortController();
  const ev = events(controller);
  const lookedUp: number[][] = [];

  const summary = await runFetchMusicInfo(db, { musicIds: [a, b, c] }, ev, {
    lookupAlbumGroup: async (musics) => {
      lookedUp.push(musics.map((music) => music.id));
      return new Map(musics.map((music) => [music.id, ok(candidate())]));
    },
    updateMusics: async (database, request) => {
      controller.abort();
      return updateOk(database, request);
    },
  });

  expect(summary.cancelled).toBe(true);
  expect(summary.updated.map((entry) => entry.music.id)).toEqual([a]);
  expect(ev.pushes).toHaveLength(1);
  expect(lookedUp).toEqual([[a, b]]);
});

it("hands the signal to the lookup and skips groups after a cancel during the search", async () => {
  const a = seed("/a.mp3", { album: "X" });
  const b = seed("/b.mp3", { album: "Y" });
  const controller = new AbortController();
  const ev = events(controller);
  const lookup = vi.fn(
    async (musics: readonly Music[], options: { signal?: AbortSignal }) => {
      expect(options.signal).toBe(controller.signal);
      controller.abort();
      return new Map(
        musics.map((music) => [
          music.id,
          {
            ok: false as const,
            error: { code: "MB_ABORTED" as const, message: "" },
          },
        ]),
      );
    },
  );

  const summary = await runFetchMusicInfo(db, { musicIds: [a, b] }, ev, {
    lookupAlbumGroup: lookup,
    updateMusics: updateOk,
  });

  expect(lookup).toHaveBeenCalledTimes(1);
  expect(summary).toEqual({
    updated: [],
    unchanged: [],
    notFound: [],
    failed: [],
    cancelled: true,
  });
  expect(ev.pushes).toEqual([]);
});

it("records an exception from the write under the track and keeps going", async () => {
  const a = seed("/a.mp3");
  const b = seed("/b.mp3");

  const summary = await runFetchMusicInfo(db, { musicIds: [a, b] }, events(), {
    lookupAlbumGroup: lookupWith({
      [a]: ok(candidate()),
      [b]: ok(candidate()),
    }),
    updateMusics: async (database, request) => {
      if (request.musicIds[0] === a) {
        throw Object.assign(new Error("gone"), { code: "MUSIC_NOT_FOUND" });
      }

      return updateOk(database, request);
    },
  });

  expect(
    summary.failed.map((entry) => [entry.musicId, entry.error.code]),
  ).toEqual([[a, "MUSIC_NOT_FOUND"]]);
  expect(summary.updated.map((entry) => entry.music.id)).toEqual([b]);
  expect(summary.cancelled).toBe(false);
});

it("records an exception from the lookup under every track of the group", async () => {
  const a = seed("/a.mp3", { album: "X" });
  const b = seed("/b.mp3", { album: "X" });
  const c = seed("/c.mp3", { album: "Y" });

  const summary = await runFetchMusicInfo(
    db,
    { musicIds: [a, b, c] },
    events(),
    {
      lookupAlbumGroup: async (musics) => {
        if (musics[0]?.album === "X") {
          throw new Error("boom");
        }

        return new Map(musics.map((music) => [music.id, ok(null)]));
      },
      updateMusics: updateOk,
    },
  );

  expect(summary.failed.map((entry) => entry.musicId)).toEqual([a, b]);
  expect(summary.failed[0]?.error).toEqual({ name: "Error", message: "boom" });
  expect(summary.notFound.map((entry) => entry.musicId)).toEqual([c]);
});

it("keeps processing later groups when a group is throttled (503 streak)", async () => {
  const a = seed("/a.mp3", { album: "X" });
  const b = seed("/b.mp3", { album: "X" });
  const c = seed("/c.mp3", { album: "Y" });

  const summary = await runFetchMusicInfo(
    db,
    { musicIds: [a, b, c] },
    events(),
    {
      lookupAlbumGroup: async (musics) =>
        new Map(
          musics.map((music) => [
            music.id,
            music.album === "X"
              ? {
                  ok: false as const,
                  error: { code: "MB_THROTTLED" as const, message: "503" },
                }
              : ok(candidate()),
          ]),
        ),
      updateMusics: updateOk,
    },
  );

  expect(
    summary.failed.map((entry) => [entry.musicId, entry.error.code]),
  ).toEqual([
    [a, "MB_THROTTLED"],
    [b, "MB_THROTTLED"],
  ]);
  expect(summary.updated.map((entry) => entry.music.id)).toEqual([c]);
  expect(summary.cancelled).toBe(false);
});

it("survives a 503 streak on one group through the real client and keeps the next group", async () => {
  const x1 = seed("/x1.mp3", { album: "X", title: "Song 1", track: 1 });
  const x2 = seed("/x2.mp3", { album: "X", title: "Song 2", track: 2 });
  const y = seed("/y.mp3", {
    album: "Year Zero",
    artist: "Nine Inch Nails",
    title: "HYPERPOWER!",
    track: 1,
    genre: "",
  });
  // Virtual clock so the interval waits collapse; the 503 attempts are
  // what this test counts.
  let clock = 0;
  let throttledAttempts = 0;
  const client = new MusicBrainzClient("ua", {
    now: () => clock,
    sleep: async (ms) => {
      clock += ms;
    },
    fetch: async (raw) => {
      const url = new URL(raw);
      if (url.hostname === "coverartarchive.org") {
        return new Response(null, { status: 404 });
      }

      const query = url.searchParams.get("query") ?? "";
      if (url.pathname === "/ws/2/release" && query.includes('release:"X"')) {
        throttledAttempts += 1;
        return new Response(null, {
          status: 503,
          headers: { "Retry-After": "1" },
        });
      }

      if (url.pathname === "/ws/2/release") {
        return Response.json(readFixture("release-search.json"));
      }

      if (url.pathname.startsWith("/ws/2/release/")) {
        return Response.json(readFixture("release-year-zero.json"));
      }

      throw new Error(`unexpected url ${raw}`);
    },
  });
  vi.spyOn(console, "warn").mockImplementation(() => {});

  const summary = await runFetchMusicInfo(
    db,
    { musicIds: [x1, x2, y] },
    events(),
    {
      lookupAlbumGroup: (musics, options) =>
        lookupAlbumGroup(client, musics, options),
      updateMusics: updateOk,
    },
  );

  // Three attempts, then the group gives up and the next group still runs
  // through the same client and queue.
  expect(throttledAttempts).toBe(3);
  expect(
    summary.failed.map((entry) => [entry.musicId, entry.error.code]),
  ).toEqual([
    [x1, "MB_THROTTLED"],
    [x2, "MB_THROTTLED"],
  ]);
  expect(summary.updated.map((entry) => entry.music.id)).toEqual([y]);
  vi.restoreAllMocks();
});
