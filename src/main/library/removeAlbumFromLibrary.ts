import type { DatabaseSync } from "node:sqlite";
import type { RemoveByGroupResult } from "./removeArtistFromLibrary";
import { removeMusicsFromLibrary } from "./removeMusicsFromLibrary";

/**
 * Delete every track of one album from the library
 * (`mp:library:removeAlbum`).
 *
 * The album is addressed by the identity key `AlbumSummary.albumKey` /
 * `AlbumGroup.key` — display artist and album name joined with a NUL
 * separator, matching `getMusicsByAlbum`. Resolved ids delegate to
 * {@link removeMusicsFromLibrary} for playlist cascade and orphan GC.
 *
 * @param db - The open library connection.
 * @param albumKey - Identity key; a malformed key removes nothing.
 * @returns Removed row count and GC'd artwork file paths.
 */
export const removeAlbumFromLibrary = (
  db: DatabaseSync,
  albumKey: string,
): RemoveByGroupResult => {
  const separator = albumKey.indexOf("\u0000");
  if (separator < 0) {
    return { removed: 0, orphanedFiles: [] };
  }

  const artist = albumKey.slice(0, separator);
  const album = albumKey.slice(separator + 1);
  const ids = (
    db
      .prepare(
        `SELECT id FROM musics
         WHERE COALESCE(NULLIF(album_artist, ''), artist) = ? AND album = ?`,
      )
      .all(artist, album) as Array<{ id: number }>
  ).map((row) => row.id);
  return {
    removed: ids.length,
    orphanedFiles: removeMusicsFromLibrary(db, ids),
  };
};
