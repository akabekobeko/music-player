import type { Music } from "../ipc/types";
import { quoteTerm } from "./quoteTerm";

/** The tags a release query is built from. */
export type ReleaseQueryInput = Pick<Music, "album" | "albumArtist" | "artist">;

/**
 * Build the Lucene query of an album-level release search
 * (`docs/specs/v1.2/architecture/search-query.md`).
 *
 * `release:` is always present (callers only search releases for groups
 * with an album title). `artist:` uses the display artist (album artist
 * falling back to artist) and is left out for the unknown artist. The
 * track count is deliberately not a condition: a partial selection of an
 * album would not match the release's count, so the candidate is checked
 * after the lookup instead.
 *
 * @param input - Album, album artist and artist tags of the group.
 * @returns The query string, e.g. `release:"Year Zero" AND artist:"NIN"`.
 */
export const buildReleaseQuery = (input: ReleaseQueryInput): string => {
  const clauses = [`release:${quoteTerm(input.album)}`];
  const displayArtist =
    input.albumArtist !== "" ? input.albumArtist : input.artist;
  if (displayArtist !== "") {
    clauses.push(`artist:${quoteTerm(displayArtist)}`);
  }

  return clauses.join(" AND ");
};
