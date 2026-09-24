import { z } from "zod";

/** Sortable fields of a smart playlist rule. */
export const smartSortFieldSchema = z.enum([
  "title",
  "artist",
  "album",
  "year",
  "duration",
  "rating",
  "addedAt",
]);

/**
 * One condition row of a smart playlist
 * (`docs/specs/v1.0/features/playlist.md`).
 */
export const smartConditionSchema = z.discriminatedUnion("field", [
  z.object({
    field: z.enum(["artist", "albumArtist", "album", "genre", "title"]),
    operator: z.enum(["is", "isNot", "contains"]),
    value: z.string(),
  }),
  z.object({
    field: z.literal("year"),
    operator: z.enum(["is", "between", "gte", "lte"]),
    value: z.number(),
    value2: z.number().optional(),
  }),
  z.object({
    /** Normalised rating in `[0, 1]`. */
    field: z.literal("rating"),
    operator: z.enum(["gte", "lte"]),
    value: z.number(),
  }),
  z.object({
    /** Duration in seconds. */
    field: z.literal("duration"),
    operator: z.enum(["gte", "lte"]),
    value: z.number(),
  }),
  z.object({
    /** "Recently added" style condition. */
    field: z.literal("addedAt"),
    operator: z.literal("inLastDays"),
    value: z.number(),
  }),
]);

/**
 * Rule document stored in `smart_playlists.rules` (JSON). The playlist
 * queries parse the stored text with this schema, so a hand-edited or
 * corrupted document is rejected before it reaches the SQL builder.
 */
export const smartPlaylistRulesSchema = z.object({
  version: z.literal(1),
  /** How conditions combine: AND (`"all"`) or OR (`"any"`). */
  match: z.enum(["all", "any"]),
  conditions: z.array(smartConditionSchema),
  sort: z
    .discriminatedUnion("field", [
      z.object({
        field: smartSortFieldSchema,
        order: z.enum(["asc", "desc"]),
      }),
      z.object({ field: z.literal("random") }),
    ])
    .optional(),
  /** Maximum number of tracks in the evaluated result. */
  limit: z.number().optional(),
});
