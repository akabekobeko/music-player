import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { type PictureInfo, PictureKind } from "@akabeko/music-metadata-editor";
import { afterEach, beforeEach, expect, it } from "vitest";
import { artworkFileName } from "./artworkFileName";
import { saveArtwork } from "./saveArtwork";

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
