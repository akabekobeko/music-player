import { expect, it } from "vitest";
import fixture from "./fixtures/releases.json";
import type { ReleaseResponse } from "./schema";
import { releasesSchema } from "./schema";
import { selectLatestRelease } from "./selectLatestRelease";

const release = (
  tag: string,
  publishedAt: string | null,
  assets: string[],
  flags: Partial<Pick<ReleaseResponse, "draft" | "prerelease">> = {},
): ReleaseResponse => ({
  tag_name: tag,
  name: tag,
  html_url: `https://github.com/akabekobeko/parade/releases/tag/${tag}`,
  published_at: publishedAt,
  draft: false,
  prerelease: false,
  assets: assets.map((name) => ({
    name,
    browser_download_url: `https://example.com/${name}`,
    size: 1,
  })),
  ...flags,
});

it("skips the draft in the fixture and picks v1.3.0", () => {
  const selected = selectLatestRelease(releasesSchema.parse(fixture));
  expect(selected?.release.tag).toBe("v1.3.0");
  expect(selected?.release.version).toBe("1.3.0");
  expect(selected?.release.publishedAt.toISOString()).toBe(
    "2026-10-04T00:23:58.000Z",
  );
  expect(selected?.release.url).toBe(
    "https://github.com/akabekobeko/parade/releases/tag/v1.3.0",
  );
  expect(selected?.unmatched).toEqual([]);
});

it("falls back to the previous release while the newest has no assets yet", () => {
  const selected = selectLatestRelease([
    release("v1.4.0", "2026-11-01T00:00:00Z", []),
    release("v1.3.0", "2026-10-04T00:23:58Z", ["Parade-1.3.0-mac-arm64.dmg"]),
  ]);
  expect(selected?.release.tag).toBe("v1.3.0");
});

it("ignores prereleases and orders by published date, not list order", () => {
  const selected = selectLatestRelease([
    release("v1.3.0", "2026-10-04T00:00:00Z", ["Parade-1.3.0-mac-arm64.dmg"]),
    release(
      "v2.0.0-beta",
      "2026-10-05T00:00:00Z",
      ["Parade-2.0.0-win-x64.exe"],
      {
        prerelease: true,
      },
    ),
    release("v1.3.1", "2026-10-06T00:00:00Z", ["Parade-1.3.1-win-x64.exe"]),
  ]);
  expect(selected?.release.tag).toBe("v1.3.1");
});

it("returns undefined when no release has a classifiable asset", () => {
  expect(
    selectLatestRelease([
      release("v1.0.0", "2026-01-01T00:00:00Z", ["notes.txt"]),
    ]),
  ).toBeUndefined();
});
