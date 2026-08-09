import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, expect, it } from "vitest";
import { expandAudioPaths, MAX_SCAN_DEPTH } from "./expandAudioPaths";

let root: string;

beforeEach(() => {
  root = mkdtempSync(path.join(tmpdir(), "mp-expand-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

/** Create an empty file, creating parent directories as needed. */
const touch = (...segments: string[]): string => {
  const filePath = path.join(root, ...segments);
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, "");
  return filePath;
};

it("keeps directly passed audio files and drops other extensions", async () => {
  const mp3 = touch("song.mp3");
  const txt = touch("readme.txt");
  expect(await expandAudioPaths([mp3, txt])).toEqual([mp3]);
});

it("matches extensions case-insensitively", async () => {
  const upper = touch("SONG.MP3");
  const mixed = touch("track.FlAc");
  expect(await expandAudioPaths([upper, mixed])).toEqual([upper, mixed].sort());
});

it("walks directories recursively and filters by extension", async () => {
  const a = touch("dir", "a.flac");
  const b = touch("dir", "sub", "b.m4a");
  touch("dir", "sub", "notes.txt");
  expect(await expandAudioPaths([path.join(root, "dir")])).toEqual(
    [a, b].sort(),
  );
});

it("stops descending below the depth limit", async () => {
  // File inside MAX_SCAN_DEPTH nested directories is reachable…
  const within = touch(
    ...Array.from({ length: MAX_SCAN_DEPTH }, (_, i) => `d${i}`),
    "ok.mp3",
  );
  // …one directory deeper is not.
  touch(
    ...Array.from({ length: MAX_SCAN_DEPTH + 1 }, (_, i) => `d${i}`),
    "deep.mp3",
  );
  expect(await expandAudioPaths([root])).toEqual([within]);
});

it("skips symbolic links to files and directories", async () => {
  const real = touch("real", "song.mp3");
  const linkedDir = path.join(root, "linked");
  symlinkSync(path.join(root, "real"), linkedDir);
  const linkedFile = path.join(root, "alias.mp3");
  symlinkSync(real, linkedFile);

  expect(await expandAudioPaths([root])).toEqual([real]);
  expect(await expandAudioPaths([linkedFile, linkedDir])).toEqual([]);
});

it("ignores non-existent paths", async () => {
  const mp3 = touch("song.mp3");
  expect(await expandAudioPaths([path.join(root, "missing"), mp3])).toEqual([
    mp3,
  ]);
});

it("de-duplicates when a file is reachable twice", async () => {
  const mp3 = touch("dir", "song.mp3");
  expect(await expandAudioPaths([mp3, path.join(root, "dir")])).toEqual([mp3]);
});

it("returns a sorted list", async () => {
  const b = touch("b.mp3");
  const a = touch("a.mp3");
  const c = touch("dir", "c.mp3");
  expect(await expandAudioPaths([b, path.join(root, "dir"), a])).toEqual([
    a,
    b,
    c,
  ]);
});
