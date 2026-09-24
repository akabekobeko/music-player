import { z } from "zod";
import { smartPlaylistRulesSchema } from "../../shared/schemas/smartPlaylistRulesSchema";

/** Row of the `playlists` SELECTs. */
export const playlistRowSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  sortOrder: z.number().int(),
});

/**
 * Row of the `smart_playlists` SELECTs. The stored rule JSON is decoded and
 * validated in one step, so a corrupted document surfaces as a parse error
 * of the row instead of reaching the SQL builder.
 */
export const smartPlaylistRowSchema = playlistRowSchema.extend({
  rules: z
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
    .pipe(smartPlaylistRulesSchema),
});
