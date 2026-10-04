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
import { prepareDemoUserData } from "./prepareDemoUserData.ts";

let userDataDir: string;
let generatedDirs: string[];

/** Stands in for the generation: records the call and writes one file. */
const generate = async (demoDir: string): Promise<void> => {
  generatedDirs.push(demoDir);
  writeFileSync(path.join(demoDir, "app.db"), "generated");
};

beforeEach(() => {
  userDataDir = mkdtempSync(path.join(os.tmpdir(), "parade-demo-test-"));
  generatedDirs = [];
});

afterEach(() => {
  rmSync(userDataDir, { recursive: true, force: true });
});

it("generates the assets into the directory of the version", async () => {
  const result = await prepareDemoUserData({
    userDataDir,
    version: 3,
    regenerate: false,
    generate,
  });

  expect(result).toEqual({
    demoDir: path.join(userDataDir, "demo-3"),
    generated: true,
  });
  expect(generatedDirs).toEqual([path.join(userDataDir, "demo-3")]);
  expect(readFileSync(path.join(result.demoDir, "app.db"), "utf-8")).toBe(
    "generated",
  );
});

it("uses a generated directory of the same version as it is", async () => {
  const { demoDir } = await prepareDemoUserData({
    userDataDir,
    version: 3,
    regenerate: false,
    generate,
  });
  writeFileSync(path.join(demoDir, "app.db"), "changed by a demo run");

  const result = await prepareDemoUserData({
    userDataDir,
    version: 3,
    regenerate: false,
    generate,
  });

  expect(result).toEqual({ demoDir, generated: false });
  expect(generatedDirs).toHaveLength(1);
  expect(readFileSync(path.join(demoDir, "app.db"), "utf-8")).toBe(
    "changed by a demo run",
  );
});

it("removes the directories of other versions and generates again", async () => {
  await prepareDemoUserData({
    userDataDir,
    version: 3,
    regenerate: false,
    generate,
  });
  mkdirSync(path.join(userDataDir, "demo"));

  const result = await prepareDemoUserData({
    userDataDir,
    version: 4,
    regenerate: false,
    generate,
  });

  expect(result.generated).toBe(true);
  expect(existsSync(path.join(userDataDir, "demo"))).toBe(false);
  expect(existsSync(path.join(userDataDir, "demo-3"))).toBe(false);
  expect(existsSync(path.join(userDataDir, "demo-4", "app.db"))).toBe(true);
});

it("generates again after a generation that failed", async () => {
  await expect(
    prepareDemoUserData({
      userDataDir,
      version: 3,
      regenerate: false,
      generate: async (demoDir) => {
        writeFileSync(path.join(demoDir, "partial"), "partial");
        throw new Error("network");
      },
    }),
  ).rejects.toThrow("network");

  const result = await prepareDemoUserData({
    userDataDir,
    version: 3,
    regenerate: false,
    generate,
  });

  expect(result.generated).toBe(true);
  expect(generatedDirs).toEqual([path.join(userDataDir, "demo-3")]);
});

it("generates again on request even when the directory is ready", async () => {
  await prepareDemoUserData({
    userDataDir,
    version: 3,
    regenerate: false,
    generate,
  });

  const result = await prepareDemoUserData({
    userDataDir,
    version: 3,
    regenerate: true,
    generate,
  });

  expect(result.generated).toBe(true);
  expect(generatedDirs).toHaveLength(2);
});

it("does not treat a failed regeneration as ready", async () => {
  await prepareDemoUserData({
    userDataDir,
    version: 3,
    regenerate: false,
    generate,
  });
  await expect(
    prepareDemoUserData({
      userDataDir,
      version: 3,
      regenerate: true,
      generate: async () => {
        throw new Error("network");
      },
    }),
  ).rejects.toThrow("network");

  const result = await prepareDemoUserData({
    userDataDir,
    version: 3,
    regenerate: false,
    generate,
  });

  expect(result.generated).toBe(true);
});

it("leaves the regular data alone", async () => {
  writeFileSync(path.join(userDataDir, "app.db"), "library");

  await prepareDemoUserData({
    userDataDir,
    version: 3,
    regenerate: false,
    generate,
  });

  expect(readFileSync(path.join(userDataDir, "app.db"), "utf-8")).toBe(
    "library",
  );
});
