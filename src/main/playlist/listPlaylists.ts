import type { DatabaseSync } from "node:sqlite";
import { z } from "zod";
import type { Playlist } from "../ipc/types";
import {
  playlistRowSchema,
  smartPlaylistRulesJsonSchema,
} from "./playlistRowSchema";

/** Smart row with the rules still encoded; decoded per row below. */
const smartPlaylistRawRowSchema = playlistRowSchema.extend({
  rules: z.string(),
});

/**
 * List every playlist of both kinds, each ordered by sort order then name.
 * Static playlists come first (`mp:playlist:list`,
 * `docs/specs/v1.0/features/playlist.md`).
 *
 * A smart playlist whose stored rules fail to decode is listed without
 * `rules` (and logged) rather than failing the whole list: the entry stays
 * visible so the user can remove or re-edit it, while opening it reports
 * the error through `getPlaylistMusics`.
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
  const smarts = smartPlaylistRawRowSchema.array().parse(
    db
      .prepare(
        `SELECT id, name, sort_order AS sortOrder, rules
         FROM smart_playlists ORDER BY sort_order, name`,
      )
      .all(),
  );
  return [
    ...statics.map((row): Playlist => ({ ...row, kind: "static" })),
    ...smarts.map(({ rules, ...row }): Playlist => {
      const decoded = smartPlaylistRulesJsonSchema.safeParse(rules);
      if (!decoded.success) {
        // The list still shows the playlist (without rules) so the user can
        // repair or delete it; the zod detail is a development aid.
        if (import.meta.env.DEV) {
          console.warn(
            `[playlist] smart playlist #${row.id}: stored rules are corrupted`,
            decoded.error,
          );
        }

        return { ...row, kind: "smart" };
      }

      return { ...row, kind: "smart", rules: decoded.data };
    }),
  ];
};
