import { expect, it } from "vitest";
import {
  buildRecordingQuery,
  type RecordingQueryInput,
} from "./buildRecordingQuery";

const input = (
  overrides: Partial<RecordingQueryInput> = {},
): RecordingQueryInput => ({
  title: "Survivalism",
  artist: "Nine Inch Nails",
  albumArtist: "",
  album: "Year Zero",
  durationMs: 262000,
  track: 2,
  ...overrides,
});

it("builds the full query with duration window and track number", () => {
  expect(buildRecordingQuery(input())).toBe(
    'recording:"Survivalism" AND artist:"Nine Inch Nails" AND release:"Year Zero" AND dur:[257000 TO 267000] AND tnum:2',
  );
});

it("falls back to the album artist and omits empty album", () => {
  expect(
    buildRecordingQuery(
      input({
        artist: "",
        albumArtist: "NIN",
        album: "",
        durationMs: 0,
        track: 0,
      }),
    ),
  ).toBe('recording:"Survivalism" AND artist:"NIN"');
});

it("omits the artist entirely when both artist tags are empty", () => {
  expect(
    buildRecordingQuery(
      input({
        artist: "",
        albumArtist: "",
        album: "",
        durationMs: 0,
        track: 0,
      }),
    ),
  ).toBe('recording:"Survivalism"');
});

it("drops the duration and track number in the relaxed variant", () => {
  expect(buildRecordingQuery(input(), { relaxed: true })).toBe(
    'recording:"Survivalism" AND artist:"Nine Inch Nails" AND release:"Year Zero"',
  );
});

it("clamps the duration window at zero and rounds fractional values", () => {
  expect(
    buildRecordingQuery(input({ durationMs: 1234.6, track: 0 })),
  ).toContain("dur:[0 TO 6235]");
});

it("escapes Lucene syntax inside the title", () => {
  expect(
    buildRecordingQuery(
      input({ title: "What Is Love?", durationMs: 0, track: 0 }),
    ),
  ).toContain('recording:"What Is Love\\?"');
});
