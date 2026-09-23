import type { DatabaseSync } from "node:sqlite";

/**
 * Detach a track from its artwork row.
 *
 * `upsertMusic` keeps an existing `picture_id` when the re-read file carries
 * no artwork (`COALESCE`), because for imports "no artwork" means "keep what
 * we have". An explicit removal therefore has to null the column itself,
 * after the upsert. The orphaned `pictures` row is GC'd by the caller.
 *
 * @param db - The open library connection.
 * @param musicId - Track to detach.
 */
export const clearMusicPictureId = (
  db: DatabaseSync,
  musicId: number,
): void => {
  db.prepare("UPDATE musics SET picture_id = NULL WHERE id = ?").run(musicId);
};
