import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { readFixture } from "./fixtures/readFixture";
import { lookupRelease } from "./lookupRelease";
import {
  MusicBrainzClient,
  type MusicBrainzClientDeps,
} from "./MusicBrainzClient/MusicBrainzClient";

beforeEach(() => {
  vi.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

it("requests the release with the full inc set, keeping the plus separators", async () => {
  const urls: string[] = [];
  const fetch: MusicBrainzClientDeps["fetch"] = async (url) => {
    urls.push(url);
    return Response.json(readFixture("release-year-zero.json"));
  };
  const client = new MusicBrainzClient("ua", {
    fetch,
    now: () => 0,
    sleep: async () => {},
  });

  const result = await lookupRelease(
    client,
    "0f6a5c2e-1111-4a5b-9c2d-000000000001",
  );

  expect(urls).toEqual([
    "https://musicbrainz.org/ws/2/release/0f6a5c2e-1111-4a5b-9c2d-000000000001?inc=recordings+artist-credits+labels+release-groups+genres+artist-rels+recording-level-rels+work-rels+work-level-rels&fmt=json",
  ]);
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value.title).toBe("Year Zero");
  }
});
