import type { DatabaseSync } from "node:sqlite";
import type { Playlist, PlaylistUpdateRequest } from "../ipc/types";
import { readPlaylist } from "./readPlaylist";

/**
 * Update a playlist (`mp:playlist:update`). Omitted fields keep their
 * current value; `musicIds` replaces a static playlist's full track order
 * wholesale (delete + insert in one transaction, as the database spec
 * prescribes). Position = identity, duplicates allowed.
 *
 * @param db - The open library connection.
 * @param request - Patch of name / sortOrder / musicIds / rules.
 * @param now - ISO-8601 timestamp for updated_at.
 * @returns The updated playlist.
 */
export const updatePlaylist = (
  db: DatabaseSync,
  request: PlaylistUpdateRequest,
  now: string,
): Playlist => {
  const current = readPlaylist(db, request.kind, request.id); // Existence check.
  const name = request.name ?? current.name;
  const sortOrder = request.sortOrder ?? current.sortOrder;
  db.exec("BEGIN");
  try {
    if (request.kind === "static") {
      db.prepare(
        "UPDATE playlists SET name = ?, sort_order = ?, updated_at = ? WHERE id = ?",
      ).run(name, sortOrder, now, request.id);
      if (request.musicIds !== undefined) {
        db.prepare("DELETE FROM playlist_musics WHERE playlist_id = ?").run(
          request.id,
        );
        const insert = db.prepare(
          "INSERT INTO playlist_musics (playlist_id, position, music_id) VALUES (?, ?, ?)",
        );
        request.musicIds.forEach((musicId, position) => {
          insert.run(request.id, position, musicId);
        });
      }
    } else {
      const rules =
        request.rules !== undefined
          ? JSON.stringify(request.rules)
          : JSON.stringify(current.rules);
      db.prepare(
        "UPDATE smart_playlists SET name = ?, sort_order = ?, rules = ?, updated_at = ? WHERE id = ?",
      ).run(name, sortOrder, rules, now, request.id);
    }

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  return readPlaylist(db, request.kind, request.id);
};
