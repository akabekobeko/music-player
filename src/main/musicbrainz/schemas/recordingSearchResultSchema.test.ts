import { expect, it } from "vitest";
import { readFixture } from "../fixtures/readFixture";
import { recordingSearchResultSchema } from "./recordingSearchResultSchema";

it("parses the saved recording search response and keeps the read fields", () => {
  const result = recordingSearchResultSchema.parse(
    readFixture("recording-search.json"),
  );

  expect(result.recordings).toHaveLength(2);
  const first = result.recordings?.[0];
  expect(first).toMatchObject({
    id: "7a1b2c3d-4444-4e5f-8a9b-000000000003",
    title: "Survivalism",
    score: 100,
    length: 262000,
  });
  expect(first?.releases).toEqual([
    {
      id: "0f6a5c2e-1111-4a5b-9c2d-000000000009",
      title: "Survivalism",
      status: "Official",
    },
    {
      id: "0f6a5c2e-1111-4a5b-9c2d-000000000004",
      title: "Year Zero",
      status: "Bootleg",
    },
    {
      id: "0f6a5c2e-1111-4a5b-9c2d-000000000001",
      title: "Year Zero",
      status: "Official",
    },
  ]);
});

it("strips undeclared fields such as artist-credit and media", () => {
  const result = recordingSearchResultSchema.parse(
    readFixture("recording-search.json"),
  );

  expect(result.recordings?.[0]).not.toHaveProperty("artist-credit");
  expect(result.recordings?.[0]?.releases?.[0]).not.toHaveProperty("media");
});

it("accepts a recording without length or releases", () => {
  const result = recordingSearchResultSchema.parse({
    recordings: [{ id: "r", title: "t", score: 50, length: null }],
  });

  expect(result.recordings?.[0]).toEqual({
    id: "r",
    title: "t",
    score: 50,
    length: null,
  });
});

it("accepts an empty result without the recordings array", () => {
  expect(recordingSearchResultSchema.parse({ count: 0 })).toEqual({});
});
