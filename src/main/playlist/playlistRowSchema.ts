import { z } from "zod";
import { smartPlaylistRulesSchema } from "../../shared/schemas/smartPlaylistRulesSchema";

/** Row of the `playlists` SELECTs. */
export const playlistRowSchema = z.object({
  /** Row id; unique only within the table the SELECT ran against. */
  id: z.number().int(),
  /** User-given name; not unique. */
  name: z.string(),
  /** `sort_order` column: position within the kind's list, ascending. */
  sortOrder: z.number().int(),
});

/**
 * Stored rule JSON of `smart_playlists.rules`, decoded and validated in one
 * step so a corrupted document surfaces as a parse issue instead of reaching
 * the SQL builder.
 */
export const smartPlaylistRulesJsonSchema = z
  .string()
  .transform((text, ctx): unknown => {
    try {
      return JSON.parse(text);
    } catch (error) {
      ctx.addIssue({
        code: "custom",
        message: `rules is not valid JSON: ${String(error)}`,
      });
      return z.NEVER;
    }
  })
  .pipe(smartPlaylistRulesSchema);

/** Row of the `smart_playlists` SELECTs with the rules decoded. */
export const smartPlaylistRowSchema = playlistRowSchema.extend({
  /** `rules` column, decoded from JSON and validated in one step. */
  rules: smartPlaylistRulesJsonSchema,
});
