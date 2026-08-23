import type { LastView } from "@mp/ipc";
import { matchPath } from "react-router";
import { UNKNOWN_ARTIST_PATH } from "@/pages/artists/artistPath";

/** Prefix of the named-artist route (`ARTIST_NAME_PATTERN`). */
const ARTIST_NAME_PREFIX = "/artists/name/";

/**
 * Decode the `:artistName` segment. `matchPath` leaves params percent-encoded
 * (`%20` stays as is), and `artistPathOf` would encode them again on the way
 * back, so the name is decoded here — the inverse of `artistPathOf`.
 *
 * @param segment - Raw path segment after `/artists/name/`.
 * @returns The artist name, or `null` when the segment is malformed.
 */
const decodeArtistName = (segment: string): string | null => {
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
};

/**
 * Derive the persisted {@link LastView} from a router pathname.
 *
 * Only the three main sections count; `/settings` and unknown paths yield
 * `null` so they never overwrite the remembered view.
 *
 * @param pathname - Current `location.pathname` (hash part without `#`).
 * @returns The view to persist, or `null` when the path is not a main view.
 */
export const lastViewOf = (pathname: string): LastView | null => {
  if (pathname === "/albums") {
    return { section: "albums" };
  }

  if (matchPath(UNKNOWN_ARTIST_PATH, pathname) !== null) {
    return { section: "artists", artist: "" };
  }

  if (pathname.startsWith(ARTIST_NAME_PREFIX)) {
    const artist = decodeArtistName(pathname.slice(ARTIST_NAME_PREFIX.length));
    return artist !== null && artist !== ""
      ? { section: "artists", artist }
      : { section: "artists" };
  }

  if (pathname === "/artists") {
    return { section: "artists" };
  }

  const playlist = matchPath("/playlists/:playlistId", pathname)?.params
    .playlistId;
  if (playlist !== undefined) {
    return { section: "playlists", playlist };
  }

  if (pathname === "/playlists") {
    return { section: "playlists" };
  }

  return null;
};
