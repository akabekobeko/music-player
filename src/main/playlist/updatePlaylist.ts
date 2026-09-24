import type { DatabaseSync } from "node:sqlite";
import { smartPlaylistRulesSchema } from "../../shared/schemas/smartPlaylistRulesSchema";
import type { Playlist, PlaylistUpdateRequest } from "../ipc/types";
import { assertPlaylistExists } from "./assertPlaylistExists";
import { readPlaylist } from "./readPlaylist";

/**
 * Update a playlist (`mp:playlist:update`). Omitted fields keep their
 * current value; `musicIds` replaces a static playlist's full track order
 * wholesale (delete + insert in one transaction, as the database spec
 * prescribes). Position = identity, duplicates allowed.
 *
 * Omitted fields are kept by `COALESCE` in the UPDATE itself, so the current
 * row (and a smart playlist's possibly corrupted rules) is never read before
 * the write; only the returned playlist decodes the rules.
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
  assertPlaylistExists(db, request.kind, request.id);
  const name = request.name ?? null;
  const sortOrder = request.sortOrder ?? null;
  db.exec("BEGIN");
  try {
    if (request.kind === "static") {
      db.prepare(
        `UPDATE playlists
         SET name = COALESCE(?, name), sort_order = COALESCE(?, sort_order), updated_at = ?
         WHERE id = ?`,
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
      // Validated on the way in so a malformed document from the Renderer
      // never reaches the table and breaks later reads.
      const rules =
        request.rules !== undefined
          ? JSON.stringify(smartPlaylistRulesSchema.parse(request.rules))
          : null;
      db.prepare(
        `UPDATE smart_playlists
         SET name = COALESCE(?, name), sort_order = COALESCE(?, sort_order),
             rules = COALESCE(?, rules), updated_at = ?
         WHERE id = ?`,
      ).run(name, sortOrder, rules, now, request.id);
    }

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  return readPlaylist(db, request.kind, request.id);
};
