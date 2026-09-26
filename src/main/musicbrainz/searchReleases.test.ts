import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { readFixture } from "./fixtures/readFixture";
import {
  MusicBrainzClient,
  type MusicBrainzClientDeps,
} from "./MusicBrainzClient/MusicBrainzClient";
import { searchReleases } from "./searchReleases";

beforeEach(() => {
  vi.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

it("requests the release endpoint with the query, limit and JSON format", async () => {
  const urls: string[] = [];
  const fetch: MusicBrainzClientDeps["fetch"] = async (url) => {
    urls.push(url);
    return Response.json(readFixture("release-search.json"));
  };
  const client = new MusicBrainzClient("ua", {
    fetch,
    now: () => 0,
    sleep: async () => {},
  });

  const result = await searchReleases(
    client,
    'release:"Year Zero" AND artist:"NIN"',
  );

  expect(urls).toEqual([
    "https://musicbrainz.org/ws/2/release?query=release%3A%22Year+Zero%22+AND+artist%3A%22NIN%22&limit=5&fmt=json",
  ]);
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value.releases?.map((hit) => hit.score)).toEqual([
      100, 95, 60,
    ]);
  }
});
