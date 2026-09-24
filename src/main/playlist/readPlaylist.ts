import type { DatabaseSync } from "node:sqlite";
import type { Playlist } from "../ipc/types";
import { playlistRowSchema, smartPlaylistRowSchema } from "./playlistRowSchema";

/** Read one playlist row back, throwing when the id does not exist. */
export const readPlaylist = (
  db: DatabaseSync,
  kind: Playlist["kind"],
  id: number,
): Playlist => {
  const row =
    kind === "static"
      ? playlistRowSchema
          .optional()
          .parse(
            db
              .prepare(
                "SELECT id, name, sort_order AS sortOrder FROM playlists WHERE id = ?",
              )
              .get(id),
          )
      : smartPlaylistRowSchema
          .optional()
          .parse(
            db
              .prepare(
                "SELECT id, name, sort_order AS sortOrder, rules FROM smart_playlists WHERE id = ?",
              )
              .get(id),
          );
  if (row === undefined) {
    throw new Error(`Playlist not found: ${kind} #${id}`);
  }

  return { ...row, kind };
};
