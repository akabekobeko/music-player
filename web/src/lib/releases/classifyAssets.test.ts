import { expect, it } from "vitest";
import { classifyAssets, primaryAsset } from "./classifyAssets";
import fixture from "./fixtures/releases.json";
import { releasesSchema } from "./schema";

const asset = (name: string, size = 1) => ({
  name,
  browser_download_url: `https://example.com/${name}`,
  size,
});

const v130 = releasesSchema
  .parse(fixture)
  .find((release) => release.tag_name === "v1.3.0");

it("classifies the v1.3.0 fixture into four platforms, primary first", () => {
  if (v130 === undefined) throw new Error("fixture lacks v1.3.0");
  const { downloads, unmatched } = classifyAssets(v130.assets);
  expect(unmatched).toEqual([]);
  expect(downloads["mac-arm64"].map((a) => a.ext)).toEqual(["dmg", "zip"]);
  expect(downloads["mac-x64"].map((a) => a.ext)).toEqual(["dmg", "zip"]);
  expect(downloads["win-x64"].map((a) => a.ext)).toEqual(["exe", "zip"]);
  expect(downloads["linux-x64"].map((a) => a.ext)).toEqual(["AppImage", "deb"]);
  expect(downloads["mac-arm64"][0]).toEqual({
    name: "Parade-1.3.0-mac-arm64.dmg",
    url: "https://github.com/akabekobeko/parade/releases/download/v1.3.0/Parade-1.3.0-mac-arm64.dmg",
    size: 129331228,
    ext: "dmg",
  });
});

it("accepts both Linux arch spellings and keeps AppImage first", () => {
  const { downloads } = classifyAssets([
    asset("Parade-1.3.0-linux-amd64.deb"),
    asset("Parade-1.3.0-linux-x86_64.AppImage"),
  ]);
  expect(downloads["linux-x64"].map((a) => a.name)).toEqual([
    "Parade-1.3.0-linux-x86_64.AppImage",
    "Parade-1.3.0-linux-amd64.deb",
  ]);
});

it("reports assets outside the naming rule or with a foreign format", () => {
  const { downloads, unmatched } = classifyAssets([
    asset("SHA256SUMS"),
    asset("Parade-1.3.0-win-arm64.exe"),
    asset("Parade-1.3.0-mac-arm64.exe"),
    asset("Parade-1.3.0-win-x64.zip"),
  ]);
  expect(unmatched).toEqual([
    "SHA256SUMS",
    "Parade-1.3.0-win-arm64.exe",
    "Parade-1.3.0-mac-arm64.exe",
  ]);
  expect(downloads["win-x64"].map((a) => a.ext)).toEqual(["zip"]);
});

it("has no primary asset when the recommended format is missing", () => {
  const { downloads } = classifyAssets([asset("Parade-1.3.0-win-x64.zip")]);
  expect(primaryAsset("win-x64", downloads["win-x64"])).toBeUndefined();
  const full = classifyAssets([
    asset("Parade-1.3.0-win-x64.zip"),
    asset("Parade-1.3.0-win-x64.exe"),
  ]);
  expect(primaryAsset("win-x64", full.downloads["win-x64"])?.ext).toBe("exe");
});
