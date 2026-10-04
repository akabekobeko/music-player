import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";
import { buildDemoLibrary } from "./buildDemoLibrary/buildDemoLibrary.ts";
import { DEMO_ARTIST_PHOTOS } from "./seed/demoArtistPhotos.ts";

/**
 * Consistency checks of `docs/demo/CREDITS.md` against the seed it is
 * generated from. A failure here usually means the seed changed without
 * running `pnpm demo:assets` again.
 */

const HEADER_ROWS = 2;

const rows = readFileSync(
  path.join(import.meta.dirname, "../../../docs/demo/CREDITS.md"),
  "utf-8",
)
  .split("\n")
  .filter((line) => line.startsWith("| "))
  .slice(HEADER_ROWS);

it("credits the photograph of every artist", () => {
  const missing = buildDemoLibrary()
    .artists.map((artist) => {
      const file = DEMO_ARTIST_PHOTOS[artist.name]?.title.replace(/^File:/, "");
      return `| ${artist.name} | [${file}](`;
    })
    .filter((prefix) => !rows.some((row) => row.startsWith(prefix)));

  expect(missing).toEqual([]);
});

it("credits nothing but the artists of the library", () => {
  expect(rows).toHaveLength(buildDemoLibrary().artists.length);
});
