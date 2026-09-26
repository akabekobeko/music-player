import { expect, it } from "vitest";
import type { RecordingSearchHit } from "../schemas/recordingSearchResultSchema";
import { selectRecordingRelease } from "./selectRecordingRelease";

const hit = (releases: RecordingSearchHit["releases"]): RecordingSearchHit => ({
  id: "r",
  title: "t",
  score: 100,
  releases,
});

const releases = [
  { id: "single", title: "Survivalism", status: "Official" },
  { id: "bootleg", title: "Year Zero", status: "Bootleg" },
  { id: "album", title: "Year Zero", status: "Official" },
];

it("prefers the release whose title matches the album tag", () => {
  expect(selectRecordingRelease(hit(releases), "year zero")?.id).toBe(
    "bootleg",
  );
});

it("falls back to the first Official release, then the first listed", () => {
  expect(selectRecordingRelease(hit(releases), "")?.id).toBe("single");
  expect(selectRecordingRelease(hit(releases), "Other")?.id).toBe("single");
  expect(
    selectRecordingRelease(
      hit([{ id: "x", title: "X", status: "Bootleg" }]),
      "",
    )?.id,
  ).toBe("x");
});

it("returns null when the recording lists no releases", () => {
  expect(selectRecordingRelease(hit(undefined), "Year Zero")).toBeNull();
  expect(selectRecordingRelease(hit([]), "")).toBeNull();
});
