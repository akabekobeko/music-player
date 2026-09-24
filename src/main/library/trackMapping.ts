import path from "node:path";
import type { Track } from "@akabeko/music-metadata-editor";
import type { AudioFormat } from "../ipc/types";

/**
 * Column values for one `musics` row, produced from a loaded {@link Track}.
 *
 * Mirrors the import mapping table in `docs/specs/v1.0/features/library.md`:
 * unset text tags become empty strings, unset year / bpm / rating become
 * `NULL`, disc defaults to 1 and track to 0. A year tag of 0 or less is junk
 * (e.g. ID3 TYE = "-1" written by some taggers) and also becomes `NULL`.
 * `lyrics` / `chapters` are deliberately absent (v1.x scope).
 */
export type MusicRowInput = {
  /** `file_path`: absolute path of the audio file, the upsert key. */
  readonly filePath: string;
  /**
   * Typed with the shared list rather than mme's union on purpose: assigning
   * `track.audioFormat` below is the compile-time proof that every format
   * mme can report is one `audioFormatSchema` reads back.
   */
  readonly audioFormat: AudioFormat;
  /**
   * `title`: `tag.title` trimmed, or the file's base name without extension
   * when the tag is unset or blank. Never empty.
   */
  readonly title: string;
  /** `artist`: `tag.artist`, empty string when unset. */
  readonly artist: string;
  /**
   * `album_artist`: `tag.albumArtist`, empty string when unset (the display
   * artist then falls back to `artist`).
   */
  readonly albumArtist: string;
  /** `album`: `tag.album`, empty string when unset. */
  readonly album: string;
  /** `disc`: `tag.discNumber` (1-based), 1 when unset. */
  readonly disc: number;
  /** `track`: `tag.trackNumber` (1-based), 0 when unset. */
  readonly track: number;
  /**
   * `year`: `tag.year` when positive; `null` when unset or 0 or less (a junk
   * tag).
   */
  readonly year: number | null;
  /** `genre`: `tag.genre`, empty string when unset. */
  readonly genre: string;
  /** `composer`: `tag.composer`, empty string when unset. */
  readonly composer: string;
  /** `lyricist`: `tag.lyricist`, empty string when unset. */
  readonly lyricist: string;
  /** `producer`: `tag.producer`, empty string when unset. */
  readonly producer: string;
  /** `conductor`: `tag.conductor`, empty string when unset. */
  readonly conductor: string;
  /** `publisher`: `tag.publisher`, empty string when unset. */
  readonly publisher: string;
  /**
   * `duration_ms`: playback length in milliseconds as reported by mme, 0
   * when unknown. May be a CBR estimate for VBR MP3 without a Xing header
   * (`docs/specs/v1.0/architecture/tech-stack.md`); playback uses the audio
   * engine's own duration instead.
   */
  readonly durationMs: number;
  /** `bpm`: `tag.bpm` (beats per minute), `null` when unset. */
  readonly bpm: number | null;
  /**
   * `rating`: `tag.rating` as normalised to `[0, 1]` by mme, stored without
   * rescaling; `null` when unset.
   */
  readonly rating: number | null;
};

/**
 * Map a loaded track to its `musics` row values.
 *
 * @param track - Result of mme's `loadTrack`.
 * @param filePath - Absolute path of the audio file (also the title
 *   fallback: base name without extension when the tag has no title).
 * @returns Column values for {@link MusicRowInput}.
 */
export const mapTrackToMusicRow = (
  track: Track,
  filePath: string,
): MusicRowInput => {
  const title = track.tag.title?.trim();
  return {
    filePath,
    audioFormat: track.audioFormat,
    title:
      title !== undefined && title !== ""
        ? title
        : path.basename(filePath, path.extname(filePath)),
    artist: track.tag.artist ?? "",
    albumArtist: track.tag.albumArtist ?? "",
    album: track.tag.album ?? "",
    disc: track.tag.discNumber ?? 1,
    track: track.tag.trackNumber ?? 0,
    year:
      track.tag.year !== undefined && track.tag.year > 0
        ? track.tag.year
        : null,
    genre: track.tag.genre ?? "",
    composer: track.tag.composer ?? "",
    lyricist: track.tag.lyricist ?? "",
    producer: track.tag.producer ?? "",
    conductor: track.tag.conductor ?? "",
    publisher: track.tag.publisher ?? "",
    durationMs: track.durationMs ?? 0,
    bpm: track.tag.bpm ?? null,
    rating: track.tag.rating ?? null,
  };
};
