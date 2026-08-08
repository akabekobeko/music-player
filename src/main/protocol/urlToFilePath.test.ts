import { expect, it } from "vitest";
import { urlToFilePath } from "./urlToFilePath";

it("extracts and decodes the path from a protocol URL", () => {
  expect(
    urlToFilePath("media-stream:///Users/a/My%20Song.flac", "media-stream"),
  ).toBe("/Users/a/My Song.flac");
});

it("normalises plain traversal segments", () => {
  expect(
    urlToFilePath("media-file:///images/../etc/passwd", "media-file"),
  ).toBe("/etc/passwd");
});

it("normalises percent-encoded traversal segments", () => {
  // %2e%2e%2f = "../" — decoding must happen before normalisation so the
  // validators compare the real target path.
  expect(
    urlToFilePath("media-file:///images/%2e%2e/etc/passwd", "media-file"),
  ).toBe("/etc/passwd");
});

it("decodes multibyte characters", () => {
  expect(
    urlToFilePath(
      "media-stream:///%E9%9F%B3%E6%A5%BD/track.mp3",
      "media-stream",
    ),
  ).toBe("/音楽/track.mp3");
});
