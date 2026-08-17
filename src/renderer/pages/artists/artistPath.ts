/**
 * Route paths of the artist view.
 *
 * The empty-name bucket ("Unknown Artist") cannot ride a `:artistName`
 * param — an empty path segment never matches — so it gets the reserved
 * `/artists/unknown` path, while real names live under `/artists/name/…`
 * where nothing can collide with the reserved word.
 */

/** Reserved path of the empty-name ("Unknown Artist") bucket. */
export const UNKNOWN_ARTIST_PATH = "/artists/unknown";

/** Named-artist route pattern for `<Route path>` / `useMatch`. */
export const ARTIST_NAME_PATTERN = "/artists/name/:artistName";

/**
 * Resolve an artist's route path (the empty name → unknown bucket).
 *
 * @param name - Exact `musics.artist` value.
 * @returns Path to navigate to.
 */
export const artistPathOf = (name: string): string =>
  name === ""
    ? UNKNOWN_ARTIST_PATH
    : `/artists/name/${encodeURIComponent(name)}`;
