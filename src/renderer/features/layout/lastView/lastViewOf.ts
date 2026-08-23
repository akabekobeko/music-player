import type { LastView } from "@mp/ipc";
import { matchPath } from "react-router";
import {
  ARTIST_NAME_PATTERN,
  UNKNOWN_ARTIST_PATH,
} from "@/pages/artists/artistPath";

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

  const artist = matchPath(ARTIST_NAME_PATTERN, pathname)?.params.artistName;
  if (artist !== undefined) {
    return { section: "artists", artist };
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
