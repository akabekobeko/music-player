import { z } from "zod";
import { smartPlaylistRulesSchema } from "./smartPlaylistRulesSchema";

/** Discriminates the two playlist tables. */
export const playlistKindSchema = z.enum(["static", "smart"]);

/**
 * One playlist as listed by `mp:playlist:list`. `id` is only unique within
 * its `kind` (static and smart playlists live in separate tables).
 */
export const playlistSchema = z
  .object({
    id: z.number().int(),
    kind: playlistKindSchema,
    name: z.string(),
    sortOrder: z.number().int(),
    /** Rule document; present only when `kind` is `"smart"`. */
    rules: smartPlaylistRulesSchema.optional(),
  })
  .readonly();
