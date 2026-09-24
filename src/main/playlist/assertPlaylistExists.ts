import type { DatabaseSync } from "node:sqlite";
import type { PlaylistKind } from "../ipc/types";
import { TABLE_OF } from "./constants";

/**
 * Throw when a playlist id does not exist in its kind's table.
 *
 * Deliberately a bare `SELECT 1` rather than `readPlaylist`: it neither
 * decodes nor validates a smart playlist's rules, so a playlist whose stored
 * rules are corrupted can still be removed or renamed from the UI.
 *
 * @param db - The open library connection.
 * @param kind - Which table to look in.
 * @param id - The playlist id.
 */
export const assertPlaylistExists = (
  db: DatabaseSync,
  kind: PlaylistKind,
  id: number,
): void => {
  const exists = db
    .prepare(`SELECT 1 FROM ${TABLE_OF[kind]} WHERE id = ?`)
    .get(id);
  if (exists === undefined) {
    throw new Error(`Playlist not found: ${kind} #${id}`);
  }
};
