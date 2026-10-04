import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";
import { sanitizeSettings } from "../../../src/main/settings/sanitizeSettings";
import { buildDemoLibrary } from "./buildDemoLibrary/buildDemoLibrary.ts";

/**
 * Checks of `docs/demo/settings.json`, the settings the generation copies
 * into the demo directory.
 */

const settings: unknown = JSON.parse(
  readFileSync(
    path.join(import.meta.dirname, "../../../docs/demo/settings.json"),
    "utf-8",
  ),
);

it("holds settings the app accepts as they are", () => {
  expect(sanitizeSettings(settings)).toEqual(settings);
});

it("opens on an artist that exists", () => {
  expect(buildDemoLibrary().artists.map((artist) => artist.name)).toContain(
    sanitizeSettings(settings).lastView?.artist,
  );
});
