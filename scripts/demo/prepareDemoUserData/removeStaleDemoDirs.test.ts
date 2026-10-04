import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, expect, it } from "vitest";
import { removeStaleDemoDirs } from "./removeStaleDemoDirs.ts";

let userDataDir: string;

const makeDir = (name: string): void => {
  mkdirSync(path.join(userDataDir, name), { recursive: true });
  writeFileSync(path.join(userDataDir, name, "app.db"), name);
};

beforeEach(() => {
  userDataDir = mkdtempSync(path.join(os.tmpdir(), "parade-demo-test-"));
});

afterEach(() => {
  rmSync(userDataDir, { recursive: true, force: true });
});

it("removes the demo directories of other versions", () => {
  makeDir("demo-1");
  makeDir("demo-2");
  makeDir("demo-3");

  expect(removeStaleDemoDirs(userDataDir, "demo-2").sort()).toEqual([
    "demo-1",
    "demo-3",
  ]);
  expect(existsSync(path.join(userDataDir, "demo-1"))).toBe(false);
  expect(existsSync(path.join(userDataDir, "demo-3"))).toBe(false);
});

it("removes the unversioned demo directory", () => {
  makeDir("demo");

  expect(removeStaleDemoDirs(userDataDir, "demo-1")).toEqual(["demo"]);
  expect(existsSync(path.join(userDataDir, "demo"))).toBe(false);
});

it("keeps the directory of the current version", () => {
  makeDir("demo-2");

  expect(removeStaleDemoDirs(userDataDir, "demo-2")).toEqual([]);
  expect(
    readFileSync(path.join(userDataDir, "demo-2", "app.db"), "utf-8"),
  ).toBe("demo-2");
});

it("leaves the regular data alone", () => {
  writeFileSync(path.join(userDataDir, "app.db"), "library");
  makeDir("images");
  makeDir("demo-backup");
  makeDir("demonstration");

  expect(removeStaleDemoDirs(userDataDir, "demo-1")).toEqual([]);
  expect(readFileSync(path.join(userDataDir, "app.db"), "utf-8")).toBe(
    "library",
  );
  expect(existsSync(path.join(userDataDir, "images"))).toBe(true);
  expect(existsSync(path.join(userDataDir, "demo-backup"))).toBe(true);
  expect(existsSync(path.join(userDataDir, "demonstration"))).toBe(true);
});

it("does nothing when the userData directory does not exist", () => {
  expect(
    removeStaleDemoDirs(path.join(userDataDir, "nowhere"), "demo-1"),
  ).toEqual([]);
});
