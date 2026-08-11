import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { net } from "electron";
import { afterEach, expect, it, vi } from "vitest";
import { runMigrations } from "../db/runMigrations";
import { fetchMediaStream } from "./fetchMediaStream";

let db: DatabaseSync | null = null;
let tempDir: string | null = null;

afterEach(() => {
  db?.close();
  db = null;
  if (tempDir !== null) {
    rmSync(tempDir, { recursive: true, force: true });
    tempDir = null;
  }
  vi.restoreAllMocks();
});

/** Create a library DB whose single track points at a real temp file. */
const setupLibrary = (
  content: string,
): { library: DatabaseSync; filePath: string } => {
  tempDir = mkdtempSync(path.join(tmpdir(), "music-player-stream-"));
  const filePath = path.join(tempDir, "song.mp3");
  writeFileSync(filePath, content);

  db = new DatabaseSync(":memory:");
  runMigrations(db);
  db.prepare(
    "INSERT INTO musics (file_path, audio_format, title, added_at, updated_at) VALUES (?, ?, ?, ?, ?)",
  ).run(
    filePath,
    "mp3",
    "Song",
    "2026-01-01T00:00:00Z",
    "2026-01-01T00:00:00Z",
  );
  return { library: db, filePath };
};

const streamUrl = (filePath: string): string =>
  `media-stream://${encodeURI(filePath)}`;

it("returns 403 for a path not registered in the library", async () => {
  const { library } = setupLibrary("0123456789");

  const response = await fetchMediaStream(
    new Request("media-stream:///etc/passwd"),
    library,
  );

  expect(response.status).toBe(403);
});

it("returns 404 when the registered file is gone from disk", async () => {
  const { library, filePath } = setupLibrary("0123456789");
  rmSync(filePath);

  const response = await fetchMediaStream(
    new Request(streamUrl(filePath)),
    library,
  );

  expect(response.status).toBe(404);
});

it("delegates a range-less request to net.fetch with the file URL", async () => {
  const { library, filePath } = setupLibrary("0123456789");
  const fetchSpy = vi
    .spyOn(net, "fetch")
    .mockResolvedValue(new Response("whole file"));

  const response = await fetchMediaStream(
    new Request(streamUrl(filePath)),
    library,
  );

  expect(fetchSpy).toHaveBeenCalledWith(
    expect.stringMatching(/^file:\/\/.*song\.mp3$/),
  );
  expect(await response.text()).toBe("whole file");
});

it("returns 206 with the requested slice for a Range request", async () => {
  const { library, filePath } = setupLibrary("0123456789");

  const response = await fetchMediaStream(
    new Request(streamUrl(filePath), {
      headers: { Range: "bytes=2-5" },
    }),
    library,
  );

  expect(response.status).toBe(206);
  expect(response.headers.get("Accept-Ranges")).toBe("bytes");
  expect(response.headers.get("Content-Type")).toBe("audio/mpeg");
  expect(response.headers.get("Content-Length")).toBe("4");
  expect(response.headers.get("Content-Range")).toBe("bytes 2-5/10");
  expect(await response.text()).toBe("2345");
});

it("adds Access-Control-Allow-Origin to range-less responses", async () => {
  const { library, filePath } = setupLibrary("0123456789");
  vi.spyOn(net, "fetch").mockResolvedValue(new Response("whole file"));

  const response = await fetchMediaStream(
    new Request(streamUrl(filePath)),
    library,
  );

  // Without this header a MediaElementAudioSourceNode over the
  // cross-origin media-stream:// source is tainted and plays silence.
  expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
});

it("adds Access-Control-Allow-Origin to 206 responses", async () => {
  const { library, filePath } = setupLibrary("0123456789");

  const response = await fetchMediaStream(
    new Request(streamUrl(filePath), {
      headers: { Range: "bytes=2-5" },
    }),
    library,
  );

  expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
});

it("returns 416 for an unsatisfiable Range", async () => {
  const { library, filePath } = setupLibrary("0123456789");

  const response = await fetchMediaStream(
    new Request(streamUrl(filePath), {
      headers: { Range: "bytes=100-200" },
    }),
    library,
  );

  expect(response.status).toBe(416);
});
