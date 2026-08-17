import type { DatabaseSync } from "node:sqlite";
import { removeMusicsFromLibrary } from "./removeMusicsFromLibrary";

/** Outcome of an artist / album removal. */
export type RemoveByGroupResult = {
  /** Number of `musics` rows deleted. */
  readonly removed: number;
  /** Artwork file paths whose rows were GC'd (delete after commit). */
  readonly orphanedFiles: readonly string[];
};

/**
 * Delete every track of one artist from the library
 * (`mp:library:removeArtist`).
 *
 * Resolves the artist's `musics.id` values and delegates to
 * {@link removeMusicsFromLibrary}, so playlist cascade and orphan GC behave
 * exactly like a manual multi-track removal.
 *
 * @param db - The open library connection.
 * @param artist - Exact `musics.artist` value; the empty string removes the
 *   unknown-artist bucket.
 * @returns Removed row count and GC'd artwork file paths.
 */
export const removeArtistFromLibrary = (
  db: DatabaseSync,
  artist: string,
): RemoveByGroupResult => {
  const ids = (
    db.prepare("SELECT id FROM musics WHERE artist = ?").all(artist) as Array<{
      id: number;
    }>
  ).map((row) => row.id);
  return {
    removed: ids.length,
    orphanedFiles: removeMusicsFromLibrary(db, ids),
  };
};
