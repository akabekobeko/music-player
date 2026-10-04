import { DEMO_ARTISTS } from "../seed/demoArtists.ts";
import type { DemoArtist, DemoArtistSeed, DemoLibrary } from "../types.ts";
import { buildDemoArtist } from "./buildDemoArtist.ts";
import { buildDemoPlaylists } from "./buildDemoPlaylists.ts";

/**
 * Build the whole demo library from the seed data.
 *
 * Pure and deterministic: the same seed always yields the same library, so
 * regenerating the assets only changes what the seed changed.
 *
 * @param seeds - Artist definitions; defaults to the committed seed data.
 * @returns Artists, albums, tracks and playlists.
 */
export const buildDemoLibrary = (
  seeds: readonly DemoArtistSeed[] = DEMO_ARTISTS,
): DemoLibrary => {
  const artists: DemoArtist[] = [];
  let albumOffset = 0;
  for (const seed of seeds) {
    artists.push(
      buildDemoArtist(
        seed,
        albumOffset,
        seeds.map((other) => other.name).filter((name) => name !== seed.name),
      ),
    );
    albumOffset += seed.albumCount;
  }

  const tracks = artists.flatMap((artist) =>
    artist.albums.flatMap((album) => album.tracks),
  );
  const playableTracks = tracks.filter((track) => track.playable);
  const playableTrack = playableTracks[0];
  if (playableTrack === undefined || playableTracks.length !== 1) {
    throw new Error("The seed must define exactly one playable track.");
  }

  return {
    artists,
    ...buildDemoPlaylists(tracks, playableTrack),
    playableTrack,
  };
};
