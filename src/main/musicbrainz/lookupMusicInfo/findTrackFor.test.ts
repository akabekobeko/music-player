import { expect, it } from "vitest";
import { readFixture } from "../fixtures/readFixture";
import { releaseSchema } from "../schemas/releaseSchema";
import { findTrackFor, type TrackMatchInput } from "./findTrackFor";

const release = releaseSchema.parse(readFixture("release-year-zero.json"));

const music = (overrides: Partial<TrackMatchInput> = {}): TrackMatchInput => ({
  title: "",
  disc: 1,
  track: 0,
  durationMs: 0,
  ...overrides,
});

it("matches by disc and track position when the track number is set", () => {
  const matched = findTrackFor(
    release,
    music({ disc: 2, track: 1, title: "wrong" }),
  );

  expect(matched?.medium.position).toBe(2);
  expect(matched?.track.title).toBe("Zero-Sum (Bonus)");
});

it("returns null when the position does not exist, without falling back to the title", () => {
  expect(
    findTrackFor(release, music({ disc: 1, track: 9, title: "Survivalism" })),
  ).toBeNull();
  expect(findTrackFor(release, music({ disc: 3, track: 1 }))).toBeNull();
});

it("matches by normalised title and close duration when the track number is unset", () => {
  const matched = findTrackFor(
    release,
    music({ title: "  survivalism ", durationMs: 265000 }),
  );

  expect(matched?.track.position).toBe(3);
  expect(matched?.medium.position).toBe(1);
});

it("rejects a title match whose duration is too far off", () => {
  expect(
    findTrackFor(release, music({ title: "Survivalism", durationMs: 300000 })),
  ).toBeNull();
});

it("accepts a title match when the library duration is unknown", () => {
  expect(
    findTrackFor(release, music({ title: "Survivalism" }))?.track.position,
  ).toBe(3);
});

it("uses the recording length when the track length is null", () => {
  expect(
    findTrackFor(
      release,
      music({ title: "Zero-Sum (Bonus)", durationMs: 374000 }),
    )?.medium.position,
  ).toBe(2);
  expect(
    findTrackFor(
      release,
      music({ title: "Zero-Sum (Bonus)", durationMs: 100000 }),
    ),
  ).toBeNull();
});

it("returns null for a release without media", () => {
  expect(
    findTrackFor({ ...release, media: undefined }, music({ title: "x" })),
  ).toBeNull();
});
