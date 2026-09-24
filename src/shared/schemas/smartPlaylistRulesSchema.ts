import { z } from "zod";

/**
 * Sortable fields of a smart playlist rule. Each maps to one `musics`
 * column (`buildSmartSql`): `artist` sorts by the track artist, not the
 * display artist of the Artist view, and `duration` by `duration_ms`.
 */
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
 * (`docs/specs/v1.0/features/playlist.md`). `buildConditionSql` turns each
 * branch into a prepared-statement fragment on the matching `musics` column.
 */
export const smartConditionSchema = z.discriminatedUnion("field", [
  z.object({
    /**
     * Text tag to compare. `albumArtist` is the raw `album_artist` column
     * with no fallback to `artist`.
     */
    field: z.enum(["artist", "albumArtist", "album", "genre", "title"]),
    /**
     * `is` / `isNot` compare the whole text exactly (case-sensitive);
     * `contains` is a `LIKE '%value%'` match, which SQLite makes
     * case-insensitive for ASCII letters only.
     */
    operator: z.enum(["is", "isNot", "contains"]),
    /**
     * Text to compare with; `%` / `_` / `\` are matched literally under
     * `contains`.
     */
    value: z.string(),
  }),
  z.object({
    /** Release year. Tracks with an unknown (`null`) year never match. */
    field: z.literal("year"),
    /**
     * `between` is inclusive on both ends; the others compare to `value`
     * alone.
     */
    operator: z.enum(["is", "between", "gte", "lte"]),
    /** The year, or the lower bound of `between`. */
    value: z.number(),
    /**
     * Upper bound of `between`; falls back to `value` (a single year) when
     * omitted.
     */
    value2: z.number().optional(),
  }),
  z.object({
    /** Normalised rating in `[0, 1]`. Unrated (`null`) tracks never match. */
    field: z.literal("rating"),
    /** Inclusive lower / upper bound. */
    operator: z.enum(["gte", "lte"]),
    /**
     * Threshold on the same `[0, 1]` scale as `Music.rating`; the rules
     * dialog enters it directly (0.1 steps), unlike the music info dialog's
     * 0 to 5 stars.
     */
    value: z.number(),
  }),
  z.object({
    /** Duration in seconds. */
    field: z.literal("duration"),
    /** Inclusive lower / upper bound. */
    operator: z.enum(["gte", "lte"]),
    /** Threshold in seconds; multiplied by 1000 against `duration_ms`. */
    value: z.number(),
  }),
  z.object({
    /** "Recently added" style condition. */
    field: z.literal("addedAt"),
    /**
     * Matches tracks whose `added_at` is at or after now minus `value`
     * days.
     */
    operator: z.literal("inLastDays"),
    /** Window length in days, measured from the evaluation instant. */
    value: z.number(),
  }),
]);

/**
 * Rule document stored in `smart_playlists.rules` (JSON). The playlist
 * queries parse the stored text with this schema, so a hand-edited or
 * corrupted document is rejected before it reaches the SQL builder.
 */
export const smartPlaylistRulesSchema = z.object({
  /** Document format version; only 1 exists, so any other value is rejected. */
  version: z.literal(1),
  /** How conditions combine: AND (`"all"`) or OR (`"any"`). */
  match: z.enum(["all", "any"]),
  /** Condition rows. An empty list matches every track in the library. */
  conditions: z.array(smartConditionSchema),
  /**
   * Result order. Omitted means the library's natural order
   * (artist, album, disc, track); `random` is `ORDER BY RANDOM()` and is
   * re-drawn on every evaluation.
   */
  sort: z
    .discriminatedUnion("field", [
      z.object({
        /** Column to sort by. */
        field: smartSortFieldSchema,
        /**
         * Direction; SQLite places `null` years / ratings first when
         * ascending.
         */
        order: z.enum(["asc", "desc"]),
      }),
      z.object({
        /** Shuffle instead of sorting by a column. */
        field: z.literal("random"),
      }),
    ])
    .optional(),
  /**
   * Maximum number of tracks in the evaluated result. Omitted, 0, or a
   * negative value means no limit.
   */
  limit: z.number().optional(),
});
