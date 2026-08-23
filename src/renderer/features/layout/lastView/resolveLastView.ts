import type { LastView } from "@mp/ipc";

type Library = {
  /** Names of the artists currently in the library (`""` = unknown bucket). */
  readonly artistNames: ReadonlySet<string>;
  /** Route ids (`p12` / `s3`) of the playlists currently in the library. */
  readonly playlistRouteIds: ReadonlySet<string>;
};

/**
 * Drop a remembered selection whose target no longer exists, keeping the
 * section tab so the user still lands where they were.
 *
 * @param view - Persisted view.
 * @param library - What exists now.
 * @returns The view to restore.
 */
export const resolveLastView = (view: LastView, library: Library): LastView => {
  switch (view.section) {
    case "artists":
      return view.artist !== undefined && library.artistNames.has(view.artist)
        ? view
        : { section: "artists" };
    case "albums":
      return view;
    case "playlists":
      return view.playlist !== undefined &&
        library.playlistRouteIds.has(view.playlist)
        ? view
        : { section: "playlists" };
  }
};
