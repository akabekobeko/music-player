import type { LastView } from "@mp/ipc";
import { playlistRouteId } from "@/features/playlist/playlistRouteId";
import { lastViewPath } from "./lastViewPath";
import { resolveLastView } from "./resolveLastView";

/**
 * Point the hash router at the remembered view before the first render
 * (`docs/specs/v1.0/renderer/routing-layout.md`).
 *
 * Runs in the bootstrap, so there is no flash of the default route. A
 * selection whose artist / playlist has since disappeared is dropped and
 * only the section tab is restored; with no remembered view (or when the
 * page already has a hash, e.g. a dev reload) nothing changes and the
 * router's default applies.
 *
 * @param view - Persisted view, if any.
 */
export const restoreLastView = async (
  view: LastView | undefined,
): Promise<void> => {
  if (view === undefined || window.location.hash !== "") {
    return;
  }

  const resolved = resolveLastView(view, {
    artistNames: await artistNames(view),
    playlistRouteIds: await playlistRouteIds(view),
  });
  window.location.hash = `#${lastViewPath(resolved)}`;
};

/** Fetch artist names only when the view actually needs them. */
const artistNames = async (view: LastView): Promise<ReadonlySet<string>> => {
  if (view.section !== "artists" || view.artist === undefined) {
    return new Set();
  }

  try {
    const result = await window.mp.library.getArtists();
    return new Set(result.ok ? result.value.map((artist) => artist.name) : []);
  } catch (error) {
    console.error("Failed to load artists for view restore", error);
    return new Set();
  }
};

/** Fetch playlist route ids only when the view actually needs them. */
const playlistRouteIds = async (
  view: LastView,
): Promise<ReadonlySet<string>> => {
  if (view.section !== "playlists" || view.playlist === undefined) {
    return new Set();
  }

  try {
    const result = await window.mp.playlist.list();
    return new Set(result.ok ? result.value.map(playlistRouteId) : []);
  } catch (error) {
    console.error("Failed to load playlists for view restore", error);
    return new Set();
  }
};
