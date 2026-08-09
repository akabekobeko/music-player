import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { type PictureInfo, PictureKind } from "@akabeko/music-metadata-editor";
import { afterEach, beforeEach, expect, it } from "vitest";
import { artworkFileName, saveArtwork, selectArtworkPicture } from "./artwork";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), "mp-artwork-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

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

it("writes the image and returns its path", async () => {
  const saved = await saveArtwork(dir, picture());
  expect(path.dirname(saved)).toBe(dir);
  expect([...readFileSync(saved)]).toEqual([1, 2, 3]);
});

it("never rewrites an existing file (dedup by content hash)", async () => {
  const target = path.join(dir, artworkFileName(picture()));
  writeFileSync(target, "sentinel");
  const saved = await saveArtwork(dir, picture());
  expect(saved).toBe(target);
  expect(readFileSync(target, "utf8")).toBe("sentinel");
});

it("creates the images directory on demand", async () => {
  const nested = path.join(dir, "not", "yet", "there");
  const saved = await saveArtwork(nested, picture());
  expect([...readFileSync(saved)]).toEqual([1, 2, 3]);
});
