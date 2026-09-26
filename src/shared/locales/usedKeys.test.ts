import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";
import { dictionaries } from "./dictionaries";

/**
 * Every literal translation key the Renderer passes to `t(...)` must exist
 * in the English dictionary (the key set's source of truth; the other
 * locales are checked for parity separately). Keys built at runtime
 * (`musicInfo.field.${name}`) are not literals and are covered by their
 * own call sites.
 */
const RENDERER_ROOT = new URL("../../renderer/", import.meta.url).pathname;
const KEY_PATTERN = /\bt\(\s*"([A-Za-z0-9_.]+)"/g;

const sourceFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      return sourceFiles(path);
    }

    return /\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry)
      ? [path]
      : [];
  });

it("every literal key used by the renderer is defined in the English dictionary", () => {
  const used = new Set<string>();
  for (const file of sourceFiles(RENDERER_ROOT)) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(KEY_PATTERN)) {
      used.add(match[1] as string);
    }
  }

  expect(used.size).toBeGreaterThan(100);
  const missing = [...used].filter((key) => dictionaries.en[key] === undefined);
  expect(missing).toEqual([]);
});
