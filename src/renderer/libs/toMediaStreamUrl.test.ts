import { expect, it } from "vitest";
import { toMediaStreamUrl } from "./toMediaStreamUrl";

it("prefixes the scheme and keeps path separators", () => {
  expect(toMediaStreamUrl("/Users/a/song.mp3")).toBe(
    "media-stream:///Users/a/song.mp3",
  );
});

it("percent-encodes characters that would break the URL", () => {
  expect(toMediaStreamUrl("/m/#1 song?.mp3")).toBe(
    "media-stream:///m/%231%20song%3F.mp3",
  );
});

it("encodes non-ASCII segments so decodeURIComponent restores them", () => {
  const url = toMediaStreamUrl("/音楽/曲.flac");
  expect(decodeURIComponent(url.replace("media-stream://", ""))).toBe(
    "/音楽/曲.flac",
  );
});
