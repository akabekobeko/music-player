import type { DatabaseSync } from "node:sqlite";
import { deleteOrphanedArtistInitials } from "./deleteOrphanedArtistInitials";
import { deleteOrphanedArtistPictures } from "./deleteOrphanedArtistPictures";
import { deleteOrphanedPictures } from "./deleteOrphanedPictures";

/**
 * Cascade-style orphan GC over the whole library, in one transaction.
 *
 * Every mutation that can strand referencing rows (library removal,
 * re-import with changed tags, artist-picture replacement) funnels through
 * the same two steps:
 * 1. Drop `artist_pictures` / `artist_initials` rows whose artist no longer
 *    has any track.
 * 2. Drop `pictures` rows referenced by neither `musics.picture_id` nor
 *    `artist_pictures.picture_id`, collecting their file paths.
 *
 * Callers that already hold a transaction call the step functions
 * directly instead (this wrapper would nest a `BEGIN`).
 *
 * @param db - The open library connection.
 * @returns Artwork file paths whose rows were GC'd — the caller deletes the
 *   files after the transaction committed (a file is never removed while a
 *   row still references it).
 */
export const cleanupLibraryOrphans = (db: DatabaseSync): string[] => {
  db.exec("BEGIN");
  try {
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
