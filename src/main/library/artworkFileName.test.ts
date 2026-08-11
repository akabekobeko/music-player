import { createHash } from "node:crypto";
import { type PictureInfo, PictureKind } from "@akabeko/music-metadata-editor";
import { expect, it } from "vitest";
import { artworkFileName } from "./artworkFileName";

const picture = (overrides: Partial<PictureInfo> = {}): PictureInfo => ({
  mimeType: "image/jpeg",
  kind: PictureKind.Other,
  data: new Uint8Array([1, 2, 3]),
  ...overrides,
});

it("names the file by SHA-256 of the bytes plus a MIME extension", () => {
  const data = new Uint8Array([10, 20, 30]);
  const expectedHash = createHash("sha256").update(data).digest("hex");
  expect(artworkFileName(picture({ data }))).toBe(`${expectedHash}.jpg`);
  expect(artworkFileName(picture({ data, mimeType: "image/png" }))).toBe(
    `${expectedHash}.png`,
  );
});

it("uses a generic extension for unknown MIME types", () => {
  expect(artworkFileName(picture({ mimeType: "image/x-weird" }))).toMatch(
    /\.img$/,
  );
});
