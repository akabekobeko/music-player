import type { DatabaseSync } from "node:sqlite";
import type { PlaylistRemoveRequest } from "../ipc/types";
import { assertPlaylistExists } from "./assertPlaylistExists";
import { TABLE_OF } from "./TABLE_OF";

/**
 * Delete a playlist (`mp:playlist:remove`). Static playlist rows cascade to
 * `playlist_musics`.
 *
 * @param db - The open library connection.
 * @param request - Target id and kind.
 */
export const removePlaylist = (
  db: DatabaseSync,
  request: PlaylistRemoveRequest,
): void => {
  assertPlaylistExists(db, request.kind, request.id);
  db.prepare(`DELETE FROM ${TABLE_OF[request.kind]} WHERE id = ?`).run(
    request.id,
  );
};
