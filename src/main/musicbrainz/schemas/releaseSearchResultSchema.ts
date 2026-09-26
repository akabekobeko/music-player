import { z } from "zod";

/**
 * Response of `/ws/2/release?query=...` (release search)
 * (`docs/specs/v1.2/architecture/response-schema.md`).
 *
 * Only what the release selection reads is declared
 * (`docs/specs/v1.2/architecture/lookup-strategy.md`): the id to look up,
 * the score to compare with `SEARCH_SCORE_THRESHOLD` and the track count to
 * compare with the group size. Everything else is stripped.
 */
export const releaseSearchResultSchema = z.object({
  /** Matching releases, best score first. Absent or empty when nothing matched. */
  releases: z
    .array(
      z.object({
        /** Release MBID, the argument of the follow-up lookup. */
        id: z.string(),
        /** Release title, for logging only. */
        title: z.string(),
        /** Lucene relevance score, an integer from 0 to 100. */
        score: z.number(),
        /**
         * Total number of tracks across all media; a candidate must hold at
         * least as many tracks as the album group has songs. Absent for
         * releases without media.
         */
        "track-count": z.number().optional(),
        /** Release status (`"Official"`, `"Bootleg"`, ...); absent when unset. */
        status: z.string().optional(),
      }),
    )
    .optional(),
});

/** Release search response as parsed by {@link releaseSearchResultSchema}. */
export type ReleaseSearchResult = z.infer<typeof releaseSearchResultSchema>;

/** One hit of a release search. */
export type ReleaseSearchHit = NonNullable<
  ReleaseSearchResult["releases"]
>[number];
