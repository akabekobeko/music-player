import type { Music } from "../ipc/types";
import { DURATION_TOLERANCE_MS } from "./constants";
import { quoteTerm } from "./quoteTerm";

/** The tags a recording query is built from. */
export type RecordingQueryInput = Pick<
  Music,
  "title" | "artist" | "albumArtist" | "album" | "durationMs" | "track"
>;

/** Options of {@link buildRecordingQuery}. */
export type RecordingQueryOptions = {
  /**
   * Drop the duration and track number conditions. Used for the single
   * re-search after a strict query returned nothing, when a wrong tag
   * rather than a missing entry is the likely cause.
   */
  readonly relaxed?: boolean;
};

/**
 * Build the Lucene query of a per-song recording search
 * (`docs/specs/v1.2/architecture/search-query.md`).
 *
 * `recording:` is always present (the importer guarantees a title). The
 * artist falls back from `artist` to `albumArtist`; the album, duration
 * window and track number are added only when the library knows them. More
 * conditions mean fewer false matches but more zero-hit searches, hence
 * the `relaxed` variant.
 *
 * @param input - Tags of the song.
 * @param options - Whether to build the relaxed variant.
 * @returns The query string.
 */
export const buildRecordingQuery = (
  input: RecordingQueryInput,
  options: RecordingQueryOptions = {},
): string => {
  const clauses = [`recording:${quoteTerm(input.title)}`];
  const artist = input.artist !== "" ? input.artist : input.albumArtist;
  if (artist !== "") {
    clauses.push(`artist:${quoteTerm(artist)}`);
  }

  if (input.album !== "") {
    clauses.push(`release:${quoteTerm(input.album)}`);
  }

  if (options.relaxed !== true) {
    if (input.durationMs > 0) {
      const ms = Math.round(input.durationMs);
      clauses.push(
        `dur:[${Math.max(0, ms - DURATION_TOLERANCE_MS)} TO ${ms + DURATION_TOLERANCE_MS}]`,
      );
    }

    if (input.track > 0) {
      clauses.push(`tnum:${Math.trunc(input.track)}`);
    }
  }

  return clauses.join(" AND ");
};
