import { type PictureInfo, PictureKind } from "@akabeko/music-metadata-editor";
import { expect, it } from "vitest";
import { replaceArtwork } from "./replaceArtwork";

const picture = (
  kind: PictureInfo["kind"],
  ...bytes: number[]
): PictureInfo => ({
  mimeType: "image/jpeg",
  kind,
  data: new Uint8Array(bytes),
});

const front = picture(PictureKind.CoverFront, 1);
const back = picture(PictureKind.CoverBack, 2);
const other = picture(PictureKind.Other, 3);
const replacement = { mimeType: "image/png", data: new Uint8Array([9]) };

it("replaces the front cover and keeps the other pictures", () => {
  const next = replaceArtwork([back, front, other], replacement);
  expect(next).toEqual([
    {
      mimeType: "image/png",
      kind: PictureKind.CoverFront,
      data: replacement.data,
    },
    back,
    other,
  ]);
});

it("replaces the first picture when there is no front cover", () => {
  const next = replaceArtwork([other, back], replacement);
  expect(next.map((entry) => entry.kind)).toEqual([
    PictureKind.CoverFront,
    PictureKind.CoverBack,
  ]);
});

it("adds a front cover to a track without pictures", () => {
  const next = replaceArtwork([], replacement);
  expect(next).toHaveLength(1);
  expect(next[0]?.kind).toBe(PictureKind.CoverFront);
});

it("removes the front cover only", () => {
  expect(replaceArtwork([front, back], null)).toEqual([back]);
});

it("removes the first picture when there is no front cover", () => {
  expect(replaceArtwork([other, back], null)).toEqual([back]);
});

it("is a no-op removal on a track without pictures", () => {
  expect(replaceArtwork([], null)).toEqual([]);
});
