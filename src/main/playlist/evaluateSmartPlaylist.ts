import type { DatabaseSync } from "node:sqlite";
import { musicSchema } from "../../shared/schemas/musicSchema";
import type { Music, SmartPlaylistRules } from "../ipc/types";
import { buildSmartSql } from "./buildSmartSql";

/**
 * Evaluate a smart playlist's rules against the library
 * (`docs/specs/v1.0/features/playlist.md`).
 *
 * Rules (`smart_playlists.rules` JSON) are converted to a prepared-statement
 * WHERE clause and executed per display / play. Play-count style conditions
 * wait for the `plays` table (v1.x).
 *
 * @param db - The open library connection.
 * @param rules - The rule document from `smart_playlists.rules`.
 * @param now - Evaluation instant (defaults to the current time).
 * @returns Matching tracks in the rules' sort order.
 */
export const evaluateSmartPlaylist = (
  db: DatabaseSync,
  rules: SmartPlaylistRules,
  now: Date = new Date(),
): Music[] => {
  const { sql, params } = buildSmartSql(rules, now);
  return musicSchema.array().parse(db.prepare(sql).all(...params));
};
