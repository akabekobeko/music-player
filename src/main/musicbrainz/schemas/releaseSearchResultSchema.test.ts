import { expect, it } from "vitest";
import { readFixture } from "../fixtures/readFixture";
import { releaseSearchResultSchema } from "./releaseSearchResultSchema";

it("parses the saved release search response and keeps the read fields", () => {
  const result = releaseSearchResultSchema.parse(
    readFixture("release-search.json"),
  );

  expect(result.releases).toHaveLength(3);
  expect(result.releases?.[0]).toEqual({
    id: "0f6a5c2e-1111-4a5b-9c2d-000000000001",
    title: "Year Zero",
    score: 100,
    "track-count": 16,
    status: "Official",
  });
});

it("strips fields that are not declared", () => {
  const result = releaseSearchResultSchema.parse(
    readFixture("release-search.json"),
  );

  expect(result).not.toHaveProperty("count");
  expect(result.releases?.[0]).not.toHaveProperty("artist-credit");
  expect(result.releases?.[0]).not.toHaveProperty("media");
});

it("accepts an empty result without the releases array", () => {
  expect(releaseSearchResultSchema.parse({ count: 0, offset: 0 })).toEqual({});
  expect(releaseSearchResultSchema.parse({ releases: [] })).toEqual({
    releases: [],
  });
});

it("rejects a hit without id or score", () => {
  expect(() =>
    releaseSearchResultSchema.parse({ releases: [{ title: "x", score: 1 }] }),
  ).toThrow();
  expect(() =>
    releaseSearchResultSchema.parse({ releases: [{ id: "x", title: "x" }] }),
  ).toThrow();
});
