import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";
import { dictionaries } from "./dictionaries";

/**
 * Two-way check between the dictionaries and the code:
 * - every literal key handed to `t(...)` exists in the English dictionary
 *   (the key set's source of truth; parity with the other locales is
 *   checked separately);
 * - every dictionary key appears as a string literal somewhere in the
 *   sources, so a key renamed on one side only cannot slip through even
 *   when it reaches `t` through a variable (`{ key }` objects).
 * Keys built at runtime (`musicInfo.field.${name}`) are listed by prefix.
 */

// fileURLToPath, not URL.pathname: the latter keeps percent-encoding and
// the leading slash before a Windows drive letter.
const SRC_ROOT = fileURLToPath(new URL("../../", import.meta.url));
const LOCALES_ROOT = fileURLToPath(new URL("./", import.meta.url));
const CALL_PATTERN = /\bt\(\s*"([A-Za-z0-9_.]+)"/g;

/** Prefixes of keys assembled at runtime from a field or option name. */
const DYNAMIC_PREFIXES = ["musicInfo.field.", "musicInfo.error."];

const sourceFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      return path.startsWith(LOCALES_ROOT) ? [] : sourceFiles(path);
    }

    return /\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry)
      ? [path]
      : [];
  });

const sources = sourceFiles(SRC_ROOT).map((file) => readFileSync(file, "utf8"));

it("every literal key handed to t() is defined in the English dictionary", () => {
  const used = new Set<string>();
  for (const source of sources) {
    for (const match of source.matchAll(CALL_PATTERN)) {
      used.add(match[1] as string);
    }
  }

  expect(used.size).toBeGreaterThan(100);
  const missing = [...used].filter((key) => dictionaries.en[key] === undefined);
  expect(missing).toEqual([]);
});

it("every dictionary key is referenced as a string literal somewhere in the sources", () => {
  const unused = Object.keys(dictionaries.en).filter(
    (key) =>
      !DYNAMIC_PREFIXES.some((prefix) => key.startsWith(prefix)) &&
      !sources.some((source) => source.includes(`"${key}"`)),
  );
  expect(unused).toEqual([]);
});
