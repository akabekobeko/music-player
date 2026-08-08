import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { net } from "electron";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { fetchMediaFile } from "./fetchMediaFile";

let tempDir: string;
let imagesDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(path.join(tmpdir(), "music-player-images-"));
  imagesDir = path.join(tempDir, "images");
  mkdirSync(imagesDir);
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

const fileUrl = (filePath: string): string =>
  `media-file://${encodeURI(filePath)}`;

it("delegates an image inside the directory to net.fetch", async () => {
  const imagePath = path.join(imagesDir, "abc.jpg");
  writeFileSync(imagePath, "jpeg-bytes");
  const fetchSpy = vi
    .spyOn(net, "fetch")
    .mockResolvedValue(new Response("jpeg-bytes"));

  const response = await fetchMediaFile(
    new Request(fileUrl(imagePath)),
    imagesDir,
  );

  expect(fetchSpy).toHaveBeenCalledWith(
    expect.stringMatching(/^file:\/\/.*abc\.jpg$/),
  );
  expect(await response.text()).toBe("jpeg-bytes");
});

it("returns 403 for a path outside the images directory", async () => {
  const outsidePath = path.join(tempDir, "settings.json");
  writeFileSync(outsidePath, "{}");

  const response = await fetchMediaFile(
    new Request(fileUrl(outsidePath)),
    imagesDir,
  );

  expect(response.status).toBe(403);
});

it("returns 403 for a percent-encoded traversal", async () => {
  const outsidePath = path.join(tempDir, "secret.txt");
  writeFileSync(outsidePath, "secret");
  const url = `media-file://${encodeURI(imagesDir)}/%2e%2e/secret.txt`;

  const response = await fetchMediaFile(new Request(url), imagesDir);

  expect(response.status).toBe(403);
});

it("returns 404 for a missing image inside the directory", async () => {
  const response = await fetchMediaFile(
    new Request(fileUrl(path.join(imagesDir, "missing.jpg"))),
    imagesDir,
  );

  expect(response.status).toBe(404);
});
