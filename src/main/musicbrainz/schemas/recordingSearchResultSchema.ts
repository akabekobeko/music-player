import { z } from "zod";

/**
 * Response of `/ws/2/recording?query=...` (recording search)
 * (`docs/specs/v1.2/architecture/response-schema.md`).
 *
 * Declares only what the per-song fallback reads
 * (`docs/specs/v1.2/architecture/lookup-strategy.md`): the score and length
 * to accept the hit, and the releases to choose which one to look up.
 */
export const recordingSearchResultSchema = z.object({
  /** Matching recordings, best score first. Absent or empty when nothing matched. */
  recordings: z
    .array(
      z.object({
        /** Recording MBID; the looked-up release's track is matched on it. */
        id: z.string(),
        /** Recording title, for logging only. */
        title: z.string(),
        /** Lucene relevance score, an integer from 0 to 100. */
        score: z.number(),
        /**
         * Recording length in ms, compared with the library's duration
         * within `DURATION_TOLERANCE_MS`. `null` or absent when unknown.
         */
        length: z.number().nullable().optional(),
        /**
         * Releases this recording appears on; one is chosen for the lookup
         * (album title match, then `Official`, then the first). Absent for
         * standalone recordings.
         */
        releases: z
          .array(
            z.object({
              /** Release MBID, the argument of the follow-up lookup. */
              id: z.string(),
              /** Release title, matched against the library's album tag. */
              title: z.string(),
              /** Release status; `"Official"` is preferred. Absent when unset. */
              status: z.string().optional(),
            }),
          )
          .optional(),
      }),
    )
    .optional(),
});

/** Recording search response as parsed by {@link recordingSearchResultSchema}. */
export type RecordingSearchResult = z.infer<typeof recordingSearchResultSchema>;

/** One hit of a recording search. */
export type RecordingSearchHit = NonNullable<
  RecordingSearchResult["recordings"]
>[number];

/** One release listed under a recording search hit. */
export type RecordingSearchRelease = NonNullable<
  RecordingSearchHit["releases"]
>[number];
