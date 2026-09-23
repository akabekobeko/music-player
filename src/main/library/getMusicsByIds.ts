import type { DatabaseSync } from "node:sqlite";
import type { Music } from "../ipc/types";
import { MUSIC_COLUMNS, type MusicRow } from "./MUSIC_COLUMNS";

/**
 * Look up tracks by id, in the order of `musicIds`.
 *
 * Ids that no longer exist are simply absent from the result — callers that
 * need every id resolved compare the lengths.
 *
 * @param db - The open library connection.
 * @param musicIds - `musics.id` values to look up.
 * @returns The matching tracks with artwork paths.
 */
export const getMusicsByIds = (
  db: DatabaseSync,
  musicIds: readonly number[],
): Music[] => {
  if (musicIds.length === 0) {
    return [];
  }

  const placeholders = musicIds.map(() => "?").join(", ");
  const rows = db
    .prepare(
      `SELECT ${MUSIC_COLUMNS}
       FROM musics m
       LEFT JOIN pictures p ON p.id = m.picture_id
       WHERE m.id IN (${placeholders})`,
    )
    .all(...musicIds) as MusicRow[];
  const byId = new Map(rows.map((row) => [row.id, { ...row } as Music]));
  return musicIds.flatMap((id) => {
    const music = byId.get(id);
    return music === undefined ? [] : [music];
  });
};
