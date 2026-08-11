import type { DatabaseSync } from "node:sqlite";
import type { Playlist, SmartPlaylistRules } from "../ipc/types";
import type { PlaylistRow } from "./types";

/** Read one playlist row back, throwing when the id does not exist. */
export const readPlaylist = (
  db: DatabaseSync,
  kind: Playlist["kind"],
  id: number,
): Playlist => {
  const row = db
    .prepare(
      kind === "static"
        ? "SELECT id, name, sort_order AS sortOrder FROM playlists WHERE id = ?"
        : "SELECT id, name, sort_order AS sortOrder, rules FROM smart_playlists WHERE id = ?",
    )
    .get(id) as PlaylistRow | undefined;
  if (row === undefined) {
    throw new Error(`Playlist not found: ${kind} #${id}`);
  }

  return {
    id: row.id,
    kind,
    name: row.name,
    sortOrder: row.sortOrder,
    ...(kind === "smart"
      ? { rules: JSON.parse(row.rules ?? "null") as SmartPlaylistRules }
      : {}),
  };
};
