import type { LastView } from "@mp/ipc";

type Library = {
  /** Names of the artists currently in the library (`""` = unknown bucket). */
  readonly artistNames: ReadonlySet<string>;
  /** Route ids (`p12` / `s3`) of the playlists currently in the library. */
  readonly playlistRouteIds: ReadonlySet<string>;
};

/**
 * Drop remembered selections whose target no longer exists, keeping the
 * section tab so the user still lands where they were.
 *
 * @param view - Persisted view.
 * @param library - What exists now.
 * @returns The view to restore.
 */
export const resolveLastView = (
  view: LastView,
  library: Library,
): LastView => ({
  section: view.section,
  ...(view.artist !== undefined && library.artistNames.has(view.artist)
    ? { artist: view.artist }
    : {}),
  ...(view.playlist !== undefined && library.playlistRouteIds.has(view.playlist)
    ? { playlist: view.playlist }
    : {}),
});
