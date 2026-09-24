import type { DatabaseSync } from "node:sqlite";
import type { Playlist } from "../ipc/types";
import { playlistRowSchema, smartPlaylistRowSchema } from "./playlistRowSchema";

/**
 * List every playlist of both kinds, each ordered by sort order then name.
 * Static playlists come first (`mp:playlist:list`,
 * `docs/specs/v1.0/features/playlist.md`).
 *
 * @param db - The open library connection.
 * @returns Playlists; smart entries carry their parsed rules.
 */
export const listPlaylists = (db: DatabaseSync): Playlist[] => {
  const statics = playlistRowSchema.array().parse(
    db
      .prepare(
        `SELECT id, name, sort_order AS sortOrder
         FROM playlists ORDER BY sort_order, name`,
      )
      .all(),
  );
  const smarts = smartPlaylistRowSchema.array().parse(
    db
      .prepare(
        `SELECT id, name, sort_order AS sortOrder, rules
         FROM smart_playlists ORDER BY sort_order, name`,
      )
      .all(),
  );
  return [
    ...statics.map((row): Playlist => ({ ...row, kind: "static" })),
    ...smarts.map((row): Playlist => ({ ...row, kind: "smart" })),
  ];
};
