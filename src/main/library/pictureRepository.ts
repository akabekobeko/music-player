import type { DatabaseSync } from "node:sqlite";

/**
 * `pictures` / `artist_pictures` access
 * (`docs/specs/v1.0/architecture/database.md`). Rows reference artwork files
 * saved by `artwork.ts`; nothing binary lives in the DB.
 */

/**
 * Resolve the `pictures.id` for an artwork path, inserting the row when it
 * does not exist yet.
 *
 * @param db - The open library connection.
 * @param filePath - Absolute artwork path (`userData/images/<hash>.<ext>`).
 * @returns The picture row id.
 */
export const getOrCreatePictureId = (
  db: DatabaseSync,
  filePath: string,
): number => {
  db.prepare(
    "INSERT INTO pictures (file_path) VALUES (?) ON CONFLICT(file_path) DO NOTHING",
  ).run(filePath);
  const row = db
    .prepare("SELECT id FROM pictures WHERE file_path = ?")
    .get(filePath) as { id: number };
  return row.id;
};

/**
 * Register an artist's representative picture if the artist has none yet.
 *
 * First import wins — later imports never overwrite
 * (`docs/specs/v1.0/features/library.md`; replacing from the UI is v1.x).
 * Empty artist names are skipped.
 *
 * @param db - The open library connection.
 * @param artist - Artist name (the `musics.artist` value).
 * @param pictureId - Picture row to associate.
 */
export const registerArtistPictureIfMissing = (
  db: DatabaseSync,
  artist: string,
  pictureId: number,
): void => {
  if (artist === "") {
    return;
  }

  db.prepare(
    "INSERT INTO artist_pictures (artist, picture_id) VALUES (?, ?) ON CONFLICT(artist) DO NOTHING",
  ).run(artist, pictureId);
};
