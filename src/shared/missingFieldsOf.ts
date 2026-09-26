/**
 * Candidate tag fields a bulk fetch may fill in
 * (`docs/specs/v1.2/features/missing-fields.md`). `title` is never missing
 * (the importer fills it from the file name) and bpm / rating have no
 * MusicBrainz value, so they are not part of the set.
 */
export type MissingField =
  | "artist"
  | "albumArtist"
  | "album"
  | "genre"
  | "composer"
  | "lyricist"
  | "producer"
  | "conductor"
  | "publisher"
  | "year"
  | "track"
  | "disc";

/** The library values the missing check reads (a subset of `Music`). */
export type MissingFieldsInput = {
  /** Track artist tag; empty when unset. */
  readonly artist: string;
  /** Album artist tag; empty when unset. */
  readonly albumArtist: string;
  /** Album title; empty when unset. */
  readonly album: string;
  /** Genre; empty when unset. */
  readonly genre: string;
  /** Composer; empty when unset. */
  readonly composer: string;
  /** Lyricist; empty when unset. */
  readonly lyricist: string;
  /** Producer; empty when unset. */
  readonly producer: string;
  /** Conductor; empty when unset. */
  readonly conductor: string;
  /** Publisher; empty when unset. */
  readonly publisher: string;
  /** Release year; `null` when unknown. */
  readonly year: number | null;
  /** Track number; the DB default `0` means unset. */
  readonly track: number;
};

const TEXT_FIELDS = [
  "artist",
  "album",
  "genre",
  "composer",
  "lyricist",
  "producer",
  "conductor",
  "publisher",
] as const;

/**
 * Which tags of a track are missing and may be completed from MusicBrainz
 * (`docs/specs/v1.2/features/missing-fields.md`).
 *
 * Text tags are missing when empty, `year` when `null`, `track` when `0`.
 * `disc` cannot be told apart from "disc 1" (the DB default is `1`), so it
 * is missing exactly when `track` is, and the two are completed together
 * from the same medium.
 *
 * `albumArtist` is missing only when `artist` is empty too: the display
 * artist (the Artist view's identity) is `albumArtist` falling back to
 * `artist`, so filling `albumArtist` next to an existing `artist` would
 * replace the artist the track is shown under (a different spelling or
 * case from MusicBrainz moves it to another artist). That is an overwrite
 * of existing data, which only an explicit choice in the music info dialog
 * may do. The dialog's default "adopt" checkboxes (v1.2 Phase 3) must be
 * derived from this same function so the two entrances never disagree.
 *
 * @param music - The track's tags.
 * @returns The missing fields.
 */
export const missingFieldsOf = (
  music: MissingFieldsInput,
): ReadonlySet<MissingField> => {
  const missing = new Set<MissingField>();
  for (const field of TEXT_FIELDS) {
    if (music[field] === "") {
      missing.add(field);
    }
  }

  if (music.albumArtist === "" && music.artist === "") {
    missing.add("albumArtist");
  }

  if (music.year === null) {
    missing.add("year");
  }

  if (music.track === 0) {
    missing.add("track");
    missing.add("disc");
  }

  return missing;
};
