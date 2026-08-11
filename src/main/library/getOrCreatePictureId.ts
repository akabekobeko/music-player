import type { DatabaseSync } from "node:sqlite";

/**
 * Resolve the `pictures.id` for an artwork path, inserting the row when it
 * does not exist yet (`docs/specs/v1.0/architecture/database.md`).
 *
 * Rows reference artwork files saved by `saveArtwork`; nothing binary lives
 * in the DB.
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
