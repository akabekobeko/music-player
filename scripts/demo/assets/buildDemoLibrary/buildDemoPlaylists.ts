import { SeededRandom } from "../SeededRandom.ts";
import type {
  DemoGenre,
  DemoPlaylist,
  DemoSmartPlaylist,
  DemoTrack,
} from "../types.ts";

/** Number of tracks in the static playlist. */
const MY_BEST_SIZE = 20;

/** Genres that get a smart playlist besides the playable track's genre. */
const SMART_GENRES: readonly DemoGenre[] = ["Jazz", "Rock"];

/** Result of {@link buildDemoPlaylists}. */
type Result = {
  /** Static playlists in sidebar order. */
  readonly playlists: readonly DemoPlaylist[];
  /** Smart playlists in sidebar order. */
  readonly smartPlaylists: readonly DemoSmartPlaylist[];
};

/**
 * Build the demo playlists.
 *
 * "My Best" opens with the playable track and continues with highly rated
 * tracks, one per artist. Every smart playlist collects one genre; the one
 * for the playable track's genre sorts by import date, newest first, which
 * puts the playable track on its first row.
 *
 * @param tracks - Every track of the library.
 * @param playableTrack - The one track with a real audio file.
 * @returns The playlists.
 */
export const buildDemoPlaylists = (
  tracks: readonly DemoTrack[],
  playableTrack: DemoTrack,
): Result => {
  const rng = new SeededRandom("playlists");
  const artists = new Set([playableTrack.albumArtist]);
  const favorites: DemoTrack[] = [playableTrack];
  for (const track of rng.shuffle(tracks)) {
    if (favorites.length >= MY_BEST_SIZE) {
      break;
    }

    if (
      track.rating !== null &&
      track.rating >= 0.8 &&
      !artists.has(track.albumArtist)
    ) {
      artists.add(track.albumArtist);
      favorites.push(track);
    }
  }

  return {
    playlists: [{ name: "My Best", tracks: favorites }],
    smartPlaylists: [
      {
        name: playableTrack.genre,
        rules: {
          version: 1,
          match: "all",
          conditions: [
            { field: "genre", operator: "is", value: playableTrack.genre },
          ],
          sort: { field: "addedAt", order: "desc" },
        },
      },
      ...SMART_GENRES.filter((genre) => genre !== playableTrack.genre).map(
        (genre) => ({
          name: genre,
          rules: {
            version: 1,
            match: "all",
            conditions: [{ field: "genre", operator: "is", value: genre }],
          },
        }),
      ),
    ],
  };
};
