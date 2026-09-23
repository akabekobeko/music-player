import type { Music } from "@mp/ipc";
import type { MusicInfoFormValues } from "./musicInfoSchema";

/** Rating shown to the user: the stored `[0, 1]` value on a 5-star scale. */
export const RATING_SCALE = 5;

/**
 * Initial form values of a single track: every tag as the text its input
 * shows. Unset numbers become empty strings; the rating is shown on the
 * 5-star scale (`docs/specs/v1.1/features/music-info-fields.md`).
 *
 * @param music - Track under edit.
 * @returns The form's default values.
 */
export const formValuesOf = (music: Music): MusicInfoFormValues => ({
  title: music.title,
  artist: music.artist,
  albumArtist: music.albumArtist,
  album: music.album,
  genre: music.genre,
  composer: music.composer,
  lyricist: music.lyricist,
  producer: music.producer,
  conductor: music.conductor,
  publisher: music.publisher,
  year: music.year === null ? "" : String(music.year),
  track: String(music.track),
  disc: String(music.disc),
  bpm: music.bpm === null ? "" : String(music.bpm),
  rating: music.rating === null ? "" : String(music.rating * RATING_SCALE),
});
