import { z } from "zod";
import { smartPlaylistRulesSchema } from "./smartPlaylistRulesSchema";

/** Discriminates the two playlist tables. */
export const playlistKindSchema = z.enum(["static", "smart"]);

/**
 * One playlist as listed by `mp:playlist:list`. `id` is only unique within
 * its `kind` (static and smart playlists live in separate tables).
 */
export const playlistSchema = z.object({
  /**
   * Row id in the table of its `kind`; the pair `(kind, id)` identifies a
   * playlist.
   */
  id: z.number().int(),
  /** Which table the playlist lives in: `playlists` or `smart_playlists`. */
  kind: playlistKindSchema,
  /**
   * User-given name. Not unique; the list orders by name only as a
   * tiebreaker.
   */
  name: z.string(),
  /**
   * Position within its kind's list, ascending. A new playlist gets
   * `MAX + 1` (0 for the first one); values may have gaps after removals.
   */
  sortOrder: z.number().int(),
  /**
   * Rule document; present only when `kind` is `"smart"`. Also absent for a
   * smart playlist whose stored rules failed to decode, which the list keeps
   * visible so the user can remove or re-edit it.
   */
  rules: smartPlaylistRulesSchema.optional(),
});
