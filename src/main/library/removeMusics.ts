import { unlink } from "node:fs/promises";
import type { DatabaseSync } from "node:sqlite";

/**
 * Library removal (`docs/specs/v1.0/features/library.md`): deletes `musics`
 * rows — **never the audio files on disk**. Playlist entries disappear via
 * `ON DELETE CASCADE`; orphaned artwork is garbage-collected here.
 */

/**
 * Delete tracks from the library and garbage-collect orphaned artwork.
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

    const orphans = db
      .prepare(
        `SELECT id, file_path FROM pictures
         WHERE id NOT IN (SELECT picture_id FROM musics WHERE picture_id IS NOT NULL)
           AND id NOT IN (SELECT picture_id FROM artist_pictures)`,
      )
      .all() as Array<{ id: number; file_path: string }>;
    if (orphans.length > 0) {
      const ids = orphans.map(() => "?").join(", ");
      db.prepare(`DELETE FROM pictures WHERE id IN (${ids})`).run(
        ...orphans.map((o) => o.id),
      );
    }

    db.exec("COMMIT");
    return orphans.map((o) => o.file_path);
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
};

/**
 * Delete GC'd artwork files from disk, best-effort.
 *
 * Failures are logged and swallowed: the DB rows are already gone, and a
 * file that could not be deleted only wastes disk space — it can never be
 * served again because `pictures` no longer references it.
 *
 * @param filePaths - Paths returned by {@link removeMusicsFromLibrary}.
 */
export const deleteArtworkFiles = async (
  filePaths: readonly string[],
): Promise<void> => {
  for (const filePath of filePaths) {
    try {
      await unlink(filePath);
    } catch (error) {
      console.warn(`[remove] failed to delete artwork: ${filePath}`, error);
    }
  }
};
