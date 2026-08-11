import type { DatabaseSync } from "node:sqlite";
import type { Playlist, SmartPlaylistRules } from "../ipc/types";
import type { PlaylistRow } from "./types";

/**
 * List every playlist of both kinds, each ordered by sort order then name.
 * Static playlists come first (`mp:playlist:list`,
 * `docs/specs/v1.0/features/playlist.md`).
 *
 * @param db - The open library connection.
 * @returns Playlists; smart entries carry their parsed rules.
 */
export const listPlaylists = (db: DatabaseSync): Playlist[] => {
  const statics = db
    .prepare(
      `SELECT id, name, sort_order AS sortOrder
       FROM playlists ORDER BY sort_order, name`,
    )
    .all() as PlaylistRow[];
  const smarts = db
    .prepare(
      `SELECT id, name, sort_order AS sortOrder, rules
       FROM smart_playlists ORDER BY sort_order, name`,
    )
    .all() as PlaylistRow[];
  return [
    ...statics.map(
      (row): Playlist => ({
        id: row.id,
        kind: "static",
        name: row.name,
        sortOrder: row.sortOrder,
      }),
    ),
    ...smarts.map(
      (row): Playlist => ({
        id: row.id,
        kind: "smart",
        name: row.name,
        sortOrder: row.sortOrder,
        rules: JSON.parse(row.rules ?? "null") as SmartPlaylistRules,
      }),
    ),
  ];
};
