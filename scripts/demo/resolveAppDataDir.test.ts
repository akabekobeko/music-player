import path from "node:path";
import { expect, it } from "vitest";
import { resolveAppDataDir } from "./resolveAppDataDir.ts";

const homeDir = path.resolve("home");

it("resolves Application Support on macOS", () => {
  expect(resolveAppDataDir({ platform: "darwin", env: {}, homeDir })).toBe(
    path.join(homeDir, "Library", "Application Support"),
  );
});

it("resolves APPDATA on Windows", () => {
  const appData = path.resolve("roaming");
  expect(
    resolveAppDataDir({
      platform: "win32",
      env: { APPDATA: appData },
      homeDir,
    }),
  ).toBe(appData);
});

it("falls back to AppData/Roaming on Windows without APPDATA", () => {
  expect(resolveAppDataDir({ platform: "win32", env: {}, homeDir })).toBe(
    path.join(homeDir, "AppData", "Roaming"),
  );
});

it("resolves XDG_CONFIG_HOME on Linux", () => {
  const config = path.resolve("xdg");
  expect(
    resolveAppDataDir({
      platform: "linux",
      env: { XDG_CONFIG_HOME: config },
      homeDir,
    }),
  ).toBe(config);
});

it("falls back to .config on Linux without XDG_CONFIG_HOME", () => {
  expect(resolveAppDataDir({ platform: "linux", env: {}, homeDir })).toBe(
    path.join(homeDir, ".config"),
  );
});
