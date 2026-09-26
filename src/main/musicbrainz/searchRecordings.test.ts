import { expect, it } from "vitest";
import { readFixture } from "./fixtures/readFixture";
import {
  MusicBrainzClient,
  type MusicBrainzClientDeps,
} from "./MusicBrainzClient/MusicBrainzClient";
import { searchRecordings } from "./searchRecordings";

it("requests the recording endpoint with the query, limit and JSON format", async () => {
  const urls: string[] = [];
  const fetch: MusicBrainzClientDeps["fetch"] = async (url) => {
    urls.push(url);
    return Response.json(readFixture("recording-search.json"));
  };
  const client = new MusicBrainzClient("ua", {
    fetch,
    now: () => 0,
    sleep: async () => {},
  });

  const result = await searchRecordings(client, 'recording:"Survivalism"');

  expect(urls).toEqual([
    "https://musicbrainz.org/ws/2/recording?query=recording%3A%22Survivalism%22&limit=5&fmt=json",
  ]);
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value.recordings).toHaveLength(2);
  }
});
