import type { Music } from "@mp/ipc";

/** The album-identity part of the grouping key. */
export const albumArtistOf = (music: Music): string =>
  music.albumArtist !== "" ? music.albumArtist : music.artist;
