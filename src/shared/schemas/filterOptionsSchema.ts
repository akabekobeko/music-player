import { z } from "zod";

/** One genre choice with the number of albums carrying it. */
export const genreCountSchema = z.object({
  /** Genre text exactly as tagged; the empty string is never listed. */
  name: z.string(),
  /**
   * Number of albums (identity key groups) with at least one track of this
   * genre. An album with mixed genres counts once per genre it carries.
   */
  count: z.number().int(),
});

/** One decade choice (start year, e.g. `1990` = 1990s) with its album count. */
export const decadeCountSchema = z.object({
  /**
   * First year of the decade, `(year / 10) * 10` over the stored years.
   * Never `null` here: unknown years go to `unknownYearCount` instead.
   */
  decade: z.number(),
  /**
   * Number of albums (identity key groups) with at least one track whose
   * year falls in this decade. An album spanning decades counts once per
   * decade it touches.
   */
  count: z.number().int(),
});

/** Choices offered by the Album view's filter UI. */
export const filterOptionsSchema = z.object({
  /** Distinct genres (empty string excluded) with their album counts. */
  genres: z.array(genreCountSchema),
  /**
   * Distinct decade start years that actually contain tracks, ascending,
   * with their album counts. Empty when no track has a year; unknown-year
   * tracks are handled by the panel's separate "Unknown" item
   * (`unknownYearCount`), not this list.
   */
  decades: z.array(decadeCountSchema),
  /** Number of albums with at least one track whose year is unknown. */
  unknownYearCount: z.number().int(),
});
