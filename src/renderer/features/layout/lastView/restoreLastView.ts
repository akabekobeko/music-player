import type { LastView } from "@mp/ipc";
import { playlistRouteId } from "@/features/playlist/playlistRouteId";
import { lastViewPath } from "./lastViewPath";
import { lastViewStore } from "./lastViewStore";
import { resolveLastView } from "./resolveLastView";

/**
 * Point the hash router at the remembered view before the first render
 * (`docs/specs/v1.0/renderer/routing-layout.md`).
 *
 * Runs in the bootstrap, so there is no flash of the default route. A
 * selection whose artist / playlist has since disappeared is dropped and
 * only the section tab is restored. The resolved view also seeds
 * `lastViewStore`, so the Sidebar's tabs know each section's selection. With
 * no remembered view nothing changes and the router's default applies; when
 * the page already has a hash (e.g. a dev reload) the store is seeded but
 * the hash is left alone.
 *
 * @param view - Persisted view, if any.
 */
export const restoreLastView = async (
  view: LastView | undefined,
): Promise<void> => {
  if (view === undefined) {
    return;
  }

  const resolved = resolveLastView(view, {
    artistNames: await artistNames(view),
    playlistRouteIds: await playlistRouteIds(view),
  });
  lastViewStore.initialize(resolved);
  if (window.location.hash === "") {
    window.location.hash = `#${lastViewPath(resolved)}`;
  }
};

/** Fetch artist names only when the view actually needs them. */
const artistNames = async (view: LastView): Promise<ReadonlySet<string>> => {
  if (view.artist === undefined) {
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
  if (view.playlist === undefined) {
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
