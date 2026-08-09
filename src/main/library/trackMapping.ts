import path from "node:path";
import type { Track } from "@akabeko/music-metadata-editor";

/**
 * Column values for one `musics` row, produced from a loaded {@link Track}.
 *
 * Mirrors the import mapping table in `docs/specs/v1.0/features/library.md`:
 * unset text tags become empty strings, unset year / bpm / rating become
 * `NULL`, disc defaults to 1 and track to 0. `lyrics` / `chapters` are
 * deliberately absent (v1.x scope).
 */
export type MusicRowInput = {
  readonly filePath: string;
  readonly audioFormat: string;
  readonly title: string;
  readonly artist: string;
  readonly albumArtist: string;
  readonly album: string;
  readonly disc: number;
  readonly track: number;
  readonly year: number | null;
  readonly genre: string;
  readonly composer: string;
  readonly durationMs: number;
  readonly bpm: number | null;
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
    year: track.tag.year ?? null,
    genre: track.tag.genre ?? "",
    composer: track.tag.composer ?? "",
    durationMs: track.durationMs ?? 0,
    bpm: track.tag.bpm ?? null,
    rating: track.tag.rating ?? null,
  };
};
