import { z } from "zod";

/** One genre choice with the number of albums carrying it. */
export const genreCountSchema = z
  .object({
    name: z.string(),
    count: z.number().int(),
  })
  .readonly();

/** One decade choice (start year, e.g. `1990` = 1990s) with its album count. */
export const decadeCountSchema = z
  .object({
    decade: z.number().int(),
    count: z.number().int(),
  })
  .readonly();

/** Choices offered by the Album view's filter UI. */
export const filterOptionsSchema = z
  .object({
    /** Distinct genres (empty string excluded) with their album counts. */
    genres: z.array(genreCountSchema).readonly(),
    /**
     * Distinct decade start years that actually contain tracks, ascending,
     * with their album counts. Empty when no track has a year; unknown-year
     * tracks are handled by the panel's separate "Unknown" item
     * (`unknownYearCount`), not this list.
     */
    decades: z.array(decadeCountSchema).readonly(),
    /** Number of albums with at least one track whose year is unknown. */
    unknownYearCount: z.number().int(),
  })
  .readonly();
