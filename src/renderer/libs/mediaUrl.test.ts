import { expect, it } from "vitest";
import { toMediaFileUrl, toMediaStreamUrl } from "./mediaUrl";

it("prefixes the scheme and keeps path separators", () => {
  expect(toMediaStreamUrl("/Users/a/song.mp3")).toBe(
    "media-stream:///Users/a/song.mp3",
  );
  expect(toMediaFileUrl("/Users/a/images/abc.jpg")).toBe(
    "media-file:///Users/a/images/abc.jpg",
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
