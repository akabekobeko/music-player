import { expect, it } from "vitest";
import { readFixture } from "../fixtures/readFixture";
import { recordingSearchResultSchema } from "../schemas/recordingSearchResultSchema";
import { selectRecordingHit } from "./selectRecordingHit";

const result = recordingSearchResultSchema.parse(
  readFixture("recording-search.json"),
);

it("picks the first hit meeting the score whose length is close", () => {
  expect(selectRecordingHit(result, 260000)?.id).toBe(
    "7a1b2c3d-4444-4e5f-8a9b-000000000003",
  );
});

it("rejects the top hit when its length is too far off and the rest score too low", () => {
  expect(selectRecordingHit(result, 305000)).toBeNull();
});

it("ignores the length when the library duration is unknown", () => {
  expect(selectRecordingHit(result, 0)?.score).toBe(100);
});

it("returns null for an empty result", () => {
  expect(selectRecordingHit({}, 1)).toBeNull();
});
