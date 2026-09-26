import { readFileSync } from "node:fs";

/**
 * Load one of the saved MusicBrainz responses next to this file as raw
 * JSON. Tests feed the value through the schema under test so the schema
 * and the mapping are verified against the same body
 * (`docs/specs/v1.2/architecture/response-schema.md`).
 *
 * @param name - File name inside `fixtures/`, e.g. `"release-year-zero.json"`.
 * @returns The parsed JSON, untyped.
 */
export const readFixture = (name: string): unknown =>
  JSON.parse(readFileSync(new URL(`./${name}`, import.meta.url), "utf8"));
