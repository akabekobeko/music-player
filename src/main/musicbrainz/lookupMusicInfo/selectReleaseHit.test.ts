import { expect, it } from "vitest";
import { readFixture } from "../fixtures/readFixture";
import { releaseSearchResultSchema } from "../schemas/releaseSearchResultSchema";
import { selectReleaseHit } from "./selectReleaseHit";

const result = releaseSearchResultSchema.parse(
  readFixture("release-search.json"),
);

it("picks the first hit that meets the score and holds enough tracks", () => {
  expect(selectReleaseHit(result, 10)?.id).toBe(
    "0f6a5c2e-1111-4a5b-9c2d-000000000001",
  );
});

it("skips a well-scoring hit with too few tracks", () => {
  const withoutAlbum = { releases: result.releases?.slice(1) };
  expect(selectReleaseHit(withoutAlbum, 3)).toBeNull();
  expect(selectReleaseHit(withoutAlbum, 2)?.id).toBe(
    "0f6a5c2e-1111-4a5b-9c2d-000000000002",
  );
});

it("never picks a hit below the threshold and handles missing track counts", () => {
  expect(
    selectReleaseHit(
      { releases: [{ id: "a", title: "a", score: 89, "track-count": 99 }] },
      1,
    ),
  ).toBeNull();
  expect(
    selectReleaseHit({ releases: [{ id: "a", title: "a", score: 100 }] }, 1),
  ).toBeNull();
  expect(selectReleaseHit({}, 1)).toBeNull();
});
