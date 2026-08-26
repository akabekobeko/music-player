import type { DatabaseSync } from "node:sqlite";
import { deleteOrphanedArtistInitials } from "./deleteOrphanedArtistInitials";
import { deleteOrphanedArtistPictures } from "./deleteOrphanedArtistPictures";
import { deleteOrphanedPictures } from "./deleteOrphanedPictures";

/**
 * Set (or replace) an artist's representative picture from the UI.
 *
 * Unlike `registerArtistPictureIfMissing` (import path, first-import-wins)
 * this is an explicit user action, so an existing association is
 * overwritten. Replacing may orphan the previous picture — orphaned
 * `artist_pictures` / `artist_initials` / `pictures` rows are GC'd in the
 * same transaction, so an association for an artist with no remaining track
 * never survives.
 *
 * @param db - The open library connection.
 * @param artist - Display-artist name (the artist list's entry); must not be empty.
 * @param pictureId - Picture row to associate.
 * @returns Artwork file paths whose rows were GC'd — the caller deletes the
 *   files after the transaction committed.
 */
export const setArtistPicture = (
  db: DatabaseSync,
  artist: string,
  pictureId: number,
): string[] => {
  if (artist === "") {
    throw new Error("Cannot set a picture for an empty artist name.");
  }

  db.exec("BEGIN");
  try {
    db.prepare(
      "INSERT INTO artist_pictures (artist, picture_id) VALUES (?, ?) ON CONFLICT(artist) DO UPDATE SET picture_id = excluded.picture_id",
    ).run(artist, pictureId);
    deleteOrphanedArtistPictures(db);
    deleteOrphanedArtistInitials(db);
    const orphaned = deleteOrphanedPictures(db);
    db.exec("COMMIT");
    return orphaned;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
};
