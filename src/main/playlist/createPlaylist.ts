import type { DatabaseSync } from "node:sqlite";
import type { Playlist, PlaylistCreateRequest } from "../ipc/types";
import { readPlaylist } from "./readPlaylist";
import { TABLE_OF } from "./TABLE_OF";

/**
 * Create a playlist at the end of its kind's sort order
 * (`mp:playlist:create`, `docs/specs/v1.0/features/playlist.md`).
 *
 * @param db - The open library connection.
 * @param request - Name, kind, and (for smart) the rule document.
 * @param now - ISO-8601 timestamp for created_at / updated_at.
 * @returns The created playlist.
 */
export const createPlaylist = (
  db: DatabaseSync,
  request: PlaylistCreateRequest,
  now: string,
): Playlist => {
  if (request.kind === "smart" && request.rules === undefined) {
    throw new Error("Smart playlist requires rules");
  }

  const table = TABLE_OF[request.kind];
  const nextOrder = (
    db
      .prepare(`SELECT COALESCE(MAX(sort_order) + 1, 0) AS next FROM ${table}`)
      .get() as { next: number }
  ).next;
  const result =
    request.kind === "static"
      ? db
          .prepare(
            `INSERT INTO playlists (name, sort_order, created_at, updated_at)
             VALUES (?, ?, ?, ?)`,
          )
          .run(request.name, nextOrder, now, now)
      : db
          .prepare(
            `INSERT INTO smart_playlists (name, rules, sort_order, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?)`,
          )
          .run(
            request.name,
            JSON.stringify(request.rules),
            nextOrder,
            now,
            now,
          );
  return readPlaylist(db, request.kind, Number(result.lastInsertRowid));
};
