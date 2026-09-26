import { z } from "zod";
import { artistCreditSchema } from "./artistCreditSchema";
import { genreSchema } from "./genreSchema";

/**
 * One relationship entry (`relations[]`) with an artist or a work as its
 * target. `type` is the human-readable relationship name
 * (`"producer"`, `"composer"`, `"performance"`); the UUID `type-id` and the
 * `direction` are not declared because the mapping never needs them
 * (`docs/specs/v1.2/architecture/release-lookup.md`).
 */
const artistTargetSchema = z.object({
  /** Canonical artist name, used when `target-credit` is empty. */
  name: z.string(),
});

const workRelationSchema = z.object({
  /** Relationship name (`"composer"`, `"lyricist"`, ...). */
  type: z.string(),
  /** Entity type of the target; only `"artist"` entries are read. */
  "target-type": z.string(),
  /** Name as credited in this relationship; empty when not overridden. */
  "target-credit": z.string().optional(),
  /** The related artist when `target-type` is `"artist"`. */
  artist: artistTargetSchema.optional(),
});

const recordingRelationSchema = z.object({
  /** Relationship name (`"producer"`, `"conductor"`, `"performance"`, ...). */
  type: z.string(),
  /** Entity type of the target: `"artist"` or `"work"` are read. */
  "target-type": z.string(),
  /** Name as credited in this relationship; empty when not overridden. */
  "target-credit": z.string().optional(),
  /** The related artist when `target-type` is `"artist"`. */
  artist: artistTargetSchema.optional(),
  /**
   * The performed work when `target-type` is `"work"`; carries its own
   * artist relationships (`work-level-rels`) for composer / lyricist.
   */
  work: z
    .object({
      /** Work MBID, for logging only. */
      id: z.string(),
      /** Work title, for logging only. */
      title: z.string(),
      /** Artist relationships of the work (`work-level-rels` + `artist-rels`). */
      relations: z.array(workRelationSchema).optional(),
    })
    .optional(),
});

/**
 * Response of `/ws/2/release/<MBID>?inc=...` (release lookup) with
 * `RELEASE_LOOKUP_INC` (`docs/specs/v1.2/architecture/response-schema.md`).
 *
 * Declares exactly the paths listed in
 * `docs/specs/v1.2/architecture/musicbrainz-data-mapping.md`; everything
 * else (release-level relations, cover art flags, text representation, ...)
 * is stripped so additions on the MusicBrainz side cannot break parsing.
 * Only MBIDs and titles are required: without them neither the mapping
 * nor the track matching can work.
 */
export const releaseSchema = z.object({
  /** Release MBID (`MusicInfoCandidate.releaseId`; Cover Art Archive key). */
  id: z.string(),
  /** Release title (`album`). */
  title: z.string(),
  /** Release status (`"Official"`, ...); absent when unset. */
  status: z.string().optional(),
  /**
   * Release date as `YYYY-MM-DD`, `YYYY-MM` or `YYYY`; only the first four
   * digits are read. Absent or empty when unknown.
   */
  date: z.string().optional(),
  /** Release-level artist credit (`albumArtist`); absent when unset. */
  "artist-credit": artistCreditSchema.optional(),
  /** Release group (`inc=release-groups`); absent when not requested. */
  "release-group": z
    .object({
      /** Release group MBID, the Cover Art Archive fallback key. */
      id: z.string(),
      /**
       * Earliest release date of the group, the `year` fallback when the
       * release has no `date`. Absent or empty when unknown.
       */
      "first-release-date": z.string().optional(),
      /** Genre votes of the group, the first source of `genre`. */
      genres: z.array(genreSchema).optional(),
    })
    .optional(),
  /**
   * Labels (`inc=labels`). Entries with a catalog number only carry no
   * `label`; the first entry with one supplies `publisher`.
   */
  "label-info": z
    .array(
      z.object({
        /** The label, or `null` / absent for catalog-number-only entries. */
        label: z
          .object({
            /** Label name (`publisher`). */
            name: z.string(),
          })
          .nullable()
          .optional(),
      }),
    )
    .optional(),
  /** Genre votes of the release, the second source of `genre`. */
  genres: z.array(genreSchema).optional(),
  /** Media (discs) with their track lists (`inc=recordings`). */
  media: z
    .array(
      z.object({
        /** Medium position within the release, 1-based (`disc`). */
        position: z.number(),
        /** Medium format (`"CD"`, `"Digital Media"`); for logging only. */
        format: z.string().optional(),
        /** Tracks of this medium, in position order. */
        tracks: z
          .array(
            z.object({
              /** Track MBID, for logging only. */
              id: z.string(),
              /** Track position within the medium, 1-based (`track`). */
              position: z.number(),
              /**
               * Track title as printed on the release (`title`); falls back
               * to the recording title when empty.
               */
              title: z.string(),
              /** Track length in ms; `null` or absent when unknown. */
              length: z.number().nullable().optional(),
              /** Track-level artist credit (`artist`); absent when unset. */
              "artist-credit": artistCreditSchema.optional(),
              /** The recording this track plays. */
              recording: z.object({
                /** Recording MBID (`MusicInfoCandidate.recordingId`). */
                id: z.string(),
                /** Recording title, the `title` fallback. */
                title: z.string(),
                /** Recording length in ms, the `length` fallback. */
                length: z.number().nullable().optional(),
                /** Genre votes of the recording, the last source of `genre`. */
                genres: z.array(genreSchema).optional(),
                /**
                 * Recording relationships (`recording-level-rels`): artist
                 * targets for producer / conductor, work targets for the
                 * composer / lyricist chain.
                 */
                relations: z.array(recordingRelationSchema).optional(),
              }),
            }),
          )
          .optional(),
      }),
    )
    .optional(),
});

/** Release lookup response as parsed by {@link releaseSchema}. */
export type Release = z.infer<typeof releaseSchema>;

/** One medium (disc) of a {@link Release}. */
export type ReleaseMedium = NonNullable<Release["media"]>[number];

/** One track of a {@link ReleaseMedium}. */
export type ReleaseTrack = NonNullable<ReleaseMedium["tracks"]>[number];

/** One relationship of a track's recording. */
export type RecordingRelation = z.infer<typeof recordingRelationSchema>;

/** One relationship of a performed work. */
export type WorkRelation = z.infer<typeof workRelationSchema>;
