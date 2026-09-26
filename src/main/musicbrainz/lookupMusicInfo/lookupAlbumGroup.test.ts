import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { Music } from "../../ipc/types";
import { readFixture } from "../fixtures/readFixture";
import {
  MusicBrainzClient,
  type MusicBrainzClientDeps,
} from "../MusicBrainzClient/MusicBrainzClient";
import { lookupAlbumGroup } from "./lookupAlbumGroup";
import { lookupMusicInfo } from "./lookupMusicInfo";

const YEAR_ZERO = "0f6a5c2e-1111-4a5b-9c2d-000000000001";
const SINGLE = "0f6a5c2e-1111-4a5b-9c2d-000000000009";
const BOOTLEG = "0f6a5c2e-1111-4a5b-9c2d-000000000004";

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

const music = (overrides: Partial<Music> = {}): Music => ({
  id: 1,
  filePath: "/music/a.mp3",
  audioFormat: "mp3",
  title: "Survivalism",
  artist: "Nine Inch Nails",
  albumArtist: "",
  album: "Year Zero",
  disc: 1,
  track: 0,
  year: null,
  genre: "",
  composer: "",
  lyricist: "",
  producer: "",
  conductor: "",
  publisher: "",
  durationMs: 262000,
  bpm: null,
  rating: null,
  pictureId: null,
  picturePath: null,
  addedAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

type Route = (url: URL) => Response | Promise<Response> | null;

/**
 * Client whose fetch dispatches on the URL. Routes are tried in order; the
 * first non-null response wins. Records every requested URL.
 */
const clientFor = (
  routes: readonly Route[],
): { client: MusicBrainzClient; urls: string[] } => {
  const urls: string[] = [];
  const fetch: MusicBrainzClientDeps["fetch"] = async (raw) => {
    urls.push(raw);
    const url = new URL(raw);
    for (const route of routes) {
      const response = await route(url);
      if (response !== null) {
        return response;
      }
    }

    throw new Error(`unexpected url ${raw}`);
  };
  return {
    client: new MusicBrainzClient("ua", {
      fetch,
      now: () => 0,
      sleep: async () => {},
    }),
    urls,
  };
};

const releaseSearch =
  (body: unknown = readFixture("release-search.json")): Route =>
  (url) =>
    url.hostname === "musicbrainz.org" && url.pathname === "/ws/2/release"
      ? Response.json(body)
      : null;

const recordingSearch =
  (body: unknown = readFixture("recording-search.json")): Route =>
  (url) =>
    url.hostname === "musicbrainz.org" && url.pathname === "/ws/2/recording"
      ? Response.json(body)
      : null;

const releaseLookup =
  (id: string, body: unknown = readFixture("release-year-zero.json")): Route =>
  (url) =>
    url.hostname === "musicbrainz.org" && url.pathname === `/ws/2/release/${id}`
      ? Response.json(body)
      : null;

const coverArt =
  (status = 200): Route =>
  (url) =>
    url.hostname === "coverartarchive.org"
      ? status === 200
        ? new Response(new Uint8Array([9]), {
            status,
            headers: { "Content-Type": "image/jpeg" },
          })
        : new Response(null, { status })
      : null;

const pathsOf = (urls: readonly string[]): string[] =>
  urls.map((url) => {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname}`;
  });

it("resolves an album group with one search and one lookup, sharing the cover", async () => {
  const { client, urls } = clientFor([
    releaseSearch(),
    releaseLookup(YEAR_ZERO),
    coverArt(),
  ]);
  const songs = [
    music({
      id: 1,
      title: "HYPERPOWER!",
      disc: 1,
      track: 1,
      durationMs: 118000,
    }),
    music({ id: 2, title: "Survivalism", track: 0, durationMs: 262000 }),
    music({
      id: 3,
      title: "Zero-Sum (Bonus)",
      disc: 2,
      track: 1,
      durationMs: 0,
    }),
  ];

  const results = await lookupAlbumGroup(client, songs);

  expect(pathsOf(urls)).toEqual([
    "musicbrainz.org/ws/2/release",
    `musicbrainz.org/ws/2/release/${YEAR_ZERO}`,
    `coverartarchive.org/release/${YEAR_ZERO}/front-1200`,
  ]);
  expect(results.size).toBe(3);
  const first = results.get(1);
  const second = results.get(2);
  const third = results.get(3);
  expect(first).toMatchObject({
    ok: true,
    value: { tags: { title: "HYPERPOWER!", track: 1, disc: 1 }, score: 100 },
  });
  expect(second).toMatchObject({
    ok: true,
    value: { tags: { title: "Survivalism", track: 3, disc: 1 } },
  });
  expect(third).toMatchObject({
    ok: true,
    value: { tags: { title: "Zero-Sum (Bonus)", track: 1, disc: 2 } },
  });
  if (first?.ok && second?.ok && first.value && second.value) {
    expect(first.value.picture).toBe(second.value.picture);
    expect(first.value.picture?.mimeType).toBe("image/jpeg");
  }
});

it("falls back to the recording search for songs not matched inside the release", async () => {
  const { client, urls } = clientFor([
    releaseSearch(),
    releaseLookup(YEAR_ZERO),
    recordingSearch(),
    releaseLookup(BOOTLEG, {
      ...(readFixture("release-year-zero.json") as object),
      id: BOOTLEG,
      status: "Bootleg",
    }),
    coverArt(404),
  ]);
  const songs = [
    music({ id: 1, title: "HYPERPOWER!", disc: 1, track: 1 }),
    music({ id: 2, title: "Not On This Album", track: 0, durationMs: 262000 }),
  ];

  const results = await lookupAlbumGroup(client, songs);

  expect(pathsOf(urls)).toEqual([
    "musicbrainz.org/ws/2/release",
    `musicbrainz.org/ws/2/release/${YEAR_ZERO}`,
    `coverartarchive.org/release/${YEAR_ZERO}/front-1200`,
    `coverartarchive.org/release/${YEAR_ZERO}/front`,
    "coverartarchive.org/release-group/2e3d1f4a-2222-4b6c-8d3e-000000000001/front-1200",
    "musicbrainz.org/ws/2/recording",
    `musicbrainz.org/ws/2/release/${BOOTLEG}`,
    `coverartarchive.org/release/${BOOTLEG}/front-1200`,
    `coverartarchive.org/release/${BOOTLEG}/front`,
    "coverartarchive.org/release-group/2e3d1f4a-2222-4b6c-8d3e-000000000001/front-1200",
  ]);
  // The recording search prefers the release titled like the album tag
  // ("Year Zero"): the first such entry of the fixture is the bootleg, which
  // is looked up and matched by recording id.
  expect(results.get(2)).toMatchObject({
    ok: true,
    value: {
      releaseId: BOOTLEG,
      recordingId: "7a1b2c3d-4444-4e5f-8a9b-000000000003",
      tags: { title: "Survivalism", track: 3 },
      picture: null,
    },
  });
});

it("uses the recording search directly when the album is unknown", async () => {
  const { client, urls } = clientFor([
    recordingSearch(),
    releaseLookup(SINGLE, {
      ...(readFixture("release-year-zero.json") as object),
      id: SINGLE,
    }),
    coverArt(),
  ]);

  const result = await lookupMusicInfo(client, music({ album: "" }));

  expect(pathsOf(urls)).toEqual([
    "musicbrainz.org/ws/2/recording",
    `musicbrainz.org/ws/2/release/${SINGLE}`,
    `coverartarchive.org/release/${SINGLE}/front-1200`,
  ]);
  // Without an album tag the first Official release of the recording wins.
  expect(result).toMatchObject({
    ok: true,
    value: { releaseId: SINGLE, tags: { title: "Survivalism" } },
  });
});

it("re-searches once with the relaxed query when the strict one has no hits", async () => {
  const queries: string[] = [];
  const { client } = clientFor([
    (url) => {
      if (url.pathname !== "/ws/2/recording") {
        return null;
      }

      queries.push(url.searchParams.get("query") ?? "");
      return Response.json(
        queries.length === 1
          ? { recordings: [] }
          : readFixture("recording-search.json"),
      );
    },
    releaseLookup(SINGLE, {
      ...(readFixture("release-year-zero.json") as object),
      id: SINGLE,
    }),
    coverArt(404),
  ]);

  const result = await lookupMusicInfo(
    client,
    music({ album: "", track: 2, durationMs: 262000 }),
  );

  expect(queries).toHaveLength(2);
  expect(queries[0]).toContain("dur:[");
  expect(queries[0]).toContain("tnum:2");
  expect(queries[1]).not.toContain("dur:[");
  expect(queries[1]).not.toContain("tnum:");
  expect(result).toMatchObject({
    ok: true,
    value: { tags: { title: "Survivalism" } },
  });
});

it("does not re-search when the strict query already had no duration or track conditions", async () => {
  const { client, urls } = clientFor([recordingSearch({ recordings: [] })]);

  const result = await lookupMusicInfo(
    client,
    music({ album: "", track: 0, durationMs: 0 }),
  );

  expect(pathsOf(urls)).toEqual(["musicbrainz.org/ws/2/recording"]);
  expect(result).toEqual({ ok: true, value: null });
});

it("reports not found when no release qualifies and the recording search scores too low", async () => {
  const { client } = clientFor([
    releaseSearch({
      releases: [{ id: "x", title: "x", score: 50, "track-count": 1 }],
    }),
    recordingSearch({ recordings: [{ id: "r", title: "t", score: 60 }] }),
  ]);

  expect(await lookupMusicInfo(client, music())).toEqual({
    ok: true,
    value: null,
  });
});

it("repeats a release search failure under every song of the group", async () => {
  const { client } = clientFor([
    (url) =>
      url.pathname === "/ws/2/release"
        ? new Response(null, { status: 500 })
        : null,
  ]);

  const results = await lookupAlbumGroup(client, [
    music({ id: 1 }),
    music({ id: 2 }),
  ]);

  expect([...results.keys()]).toEqual([1, 2]);
  for (const result of results.values()) {
    expect(result).toMatchObject({ ok: false, error: { code: "MB_HTTP_500" } });
  }
});

it("fails the group when the cover download fails with something other than 404", async () => {
  const { client } = clientFor([
    releaseSearch(),
    releaseLookup(YEAR_ZERO),
    coverArt(500),
  ]);

  const results = await lookupAlbumGroup(client, [music({ track: 3 })]);

  expect(results.get(1)).toMatchObject({
    ok: false,
    error: { code: "MB_HTTP_500" },
  });
});

it("returns not found for an empty group and for a song missing from the group result", async () => {
  const { client } = clientFor([]);

  expect((await lookupAlbumGroup(client, [])).size).toBe(0);
});
