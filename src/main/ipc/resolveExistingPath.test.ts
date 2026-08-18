import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, expect, it } from "vitest";
import { resolveExistingPath } from "./resolveExistingPath";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), "mp-resolve-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

it("returns an existing directory as-is", () => {
  const nested = path.join(dir, "a", "b");
  mkdirSync(nested, { recursive: true });
  expect(resolveExistingPath(nested)).toBe(nested);
});

it("returns an existing file as-is", () => {
  const file = path.join(dir, "song.flac");
  writeFileSync(file, "", "utf8");
  expect(resolveExistingPath(file)).toBe(file);
});

it("climbs to the nearest existing ancestor of a missing path", () => {
  const kept = path.join(dir, "kept");
  mkdirSync(kept, { recursive: true });
  expect(resolveExistingPath(path.join(kept, "gone", "deeper"))).toBe(kept);
});

it("climbs multiple levels when the whole subtree is gone", () => {
  expect(resolveExistingPath(path.join(dir, "x", "y", "z"))).toBe(dir);
});

it("returns null when the climb ends at the filesystem root", () => {
  const missing = path.join(
    path.parse(dir).root,
    `mp-resolve-missing-${process.pid}`,
    "deeper",
  );
  expect(resolveExistingPath(missing)).toBeNull();
});
