import { type PictureInfo, PictureKind } from "@akabeko/music-metadata-editor";
import { expect, it } from "vitest";
import { selectArtworkPicture } from "./selectArtworkPicture";

const picture = (overrides: Partial<PictureInfo> = {}): PictureInfo => ({
  mimeType: "image/jpeg",
  kind: PictureKind.Other,
  data: new Uint8Array([1, 2, 3]),
  ...overrides,
});

it("prefers the CoverFront picture", () => {
  const front = picture({ kind: PictureKind.CoverFront });
  const other = picture({ kind: PictureKind.Other });
  expect(selectArtworkPicture([other, front])).toBe(front);
});

it("falls back to the first picture when no CoverFront exists", () => {
  const first = picture({ kind: PictureKind.Leaflet });
  const second = picture({ kind: PictureKind.Other });
  expect(selectArtworkPicture([first, second])).toBe(first);
});

it("returns null when the track has no pictures", () => {
  expect(selectArtworkPicture([])).toBeNull();
});
