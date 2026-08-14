import type { DatabaseSync } from "node:sqlite";
import { deleteOrphanedPictures } from "./deleteOrphanedPictures";

/**
 * Delete tracks from the library and garbage-collect orphaned artwork.
 *
 * Library removal (`docs/specs/v1.0/features/library.md`) deletes `musics`
 * rows — **never the audio files on disk**. Playlist entries disappear via
 * `ON DELETE CASCADE`.
 *
 * GC order inside one transaction:
 * 1. Drop `artist_pictures` rows whose artist no longer has any track.
 * 2. Drop `pictures` rows referenced by neither `musics.picture_id` nor
 *    `artist_pictures.picture_id`, collecting their file paths.
 *
 * @param db - The open library connection.
 * @param musicIds - `musics.id` values to remove.
 * @returns Artwork file paths whose rows were GC'd — the caller deletes the
 *   files after the transaction committed (a file is never removed while a
 *   row still references it).
 */
export const removeMusicsFromLibrary = (
  db: DatabaseSync,
  musicIds: readonly number[],
): string[] => {
  if (musicIds.length === 0) {
    return [];
  }

  const placeholders = musicIds.map(() => "?").join(", ");
  db.exec("BEGIN");
  try {
    db.prepare(`DELETE FROM musics WHERE id IN (${placeholders})`).run(
      ...musicIds,
    );
    db.prepare(
      "DELETE FROM artist_pictures WHERE artist NOT IN (SELECT DISTINCT artist FROM musics)",
    ).run();

    const orphaned = deleteOrphanedPictures(db);
    db.exec("COMMIT");
    return orphaned;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
};
